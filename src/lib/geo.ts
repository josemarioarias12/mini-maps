import type { Calle, Grafo } from './tipos';
import type { Alcanzable } from './isocronas';

export type LngLat = [number, number];

const rad = (g: number): number => (g * Math.PI) / 180;

/** Distancia en km entre dos puntos [lng, lat]. */
export function distanciaKm(a: LngLat, b: LngLat): number {
  const h = Math.sin(rad(b[1] - a[1]) / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(h));
}

/** ¿Todos los lugares tienen latitud y longitud? (si no, se usa el mapa esquemático) */
export function tieneCoordenadas(g: Grafo): boolean {
  return g.lugares.length > 0 && g.lugares.every((l) => l.lat !== undefined && l.lng !== undefined);
}

export function posicion(g: Grafo, id: string): LngLat | null {
  const l = g.lugares.find((x) => x.id === id);
  return l && l.lat !== undefined && l.lng !== undefined ? [l.lng, l.lat] : null;
}

/** Trazado de una calle orientado para que empiece en `desde` (el real si existe; si no, una recta). */
export function geometriaOrientada(g: Grafo, c: Calle, desde: string): LngLat[] {
  const A = posicion(g, desde);
  const B = posicion(g, desde === c.a ? c.b : c.a);
  if (!A || !B) return [];
  const geo = c.geometria;
  if (!geo || geo.length < 2) return [A, B];
  const orientada = distanciaKm(geo[0], A) <= distanciaKm(geo[geo.length - 1], A);
  return (orientada ? geo : [...geo].reverse()).map((p) => [p[0], p[1]] as LngLat);
}

/** Trazado completo de una ruta (índices de lugares) uniendo el trazado real de cada calle. */
export function trazarRuta(g: Grafo, ruta: number[]): LngLat[] {
  const salida: LngLat[] = [];
  for (let i = 0; i < ruta.length - 1; i++) {
    const de = g.lugares[ruta[i]].id;
    const a = g.lugares[ruta[i + 1]].id;
    const c = g.calles.find((x) => (x.a === de && x.b === a) || (x.a === a && x.b === de));
    if (!c) continue;
    const tramo = geometriaOrientada(g, c, de);
    salida.push(...(salida.length ? tramo.slice(1) : tramo));
  }
  return salida;
}

export function longitudKm(coords: LngLat[]): number {
  let t = 0;
  for (let i = 1; i < coords.length; i++) t += distanciaKm(coords[i - 1], coords[i]);
  return t;
}

/** Punto situado a la fracción `f` (0-1) del recorrido. */
export function interpolar(coords: LngLat[], f: number): LngLat {
  if (coords.length === 0) return [0, 0];
  let objetivo = Math.min(1, Math.max(0, f)) * longitudKm(coords);
  for (let i = 1; i < coords.length; i++) {
    const seg = distanciaKm(coords[i - 1], coords[i]);
    if (objetivo <= seg || i === coords.length - 1) {
      const t = seg === 0 ? 0 : Math.min(1, objetivo / seg);
      return [coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * t, coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * t];
    }
    objetivo -= seg;
  }
  return coords[coords.length - 1];
}

/** Primeros `f` (0-1) del recorrido, con el último punto interpolado. */
export function trozoHasta(coords: LngLat[], f: number): LngLat[] {
  if (coords.length < 2 || f >= 1) return coords;
  if (f <= 0) return [coords[0]];
  const total = longitudKm(coords);
  let acumulado = 0;
  const salida: LngLat[] = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    const seg = distanciaKm(coords[i - 1], coords[i]);
    if (acumulado + seg >= f * total) {
      salida.push(interpolar(coords, f));
      return salida;
    }
    acumulado += seg;
    salida.push(coords[i]);
  }
  return salida;
}

/** Límites [oeste, sur, este, norte] (formato de MapLibre fitBounds). */
export function limites(coords: LngLat[]): [number, number, number, number] | null {
  if (coords.length === 0) return null;
  const xs = coords.map((c) => c[0]);
  const ys = coords.map((c) => c[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function circulo(centro: LngLat, radioKm: number, pasos = 24): LngLat[] {
  const dLat = radioKm / 110.574;
  const dLng = radioKm / (111.32 * Math.cos(rad(centro[1])));
  return Array.from({ length: pasos }, (_, i) => {
    const t = (i / pasos) * 2 * Math.PI;
    return [centro[0] + dLng * Math.cos(t), centro[1] + dLat * Math.sin(t)] as LngLat;
  });
}

/** Casco convexo (cadena monótona de Andrew). */
export function cascoConvexo(puntos: LngLat[]): LngLat[] {
  const p = [...puntos].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cruz = (o: LngLat, a: LngLat, b: LngLat): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const construir = (lista: LngLat[]): LngLat[] => {
    const h: LngLat[] = [];
    for (const q of lista) {
      while (h.length >= 2 && cruz(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
      h.push(q);
    }
    h.pop();
    return h;
  };
  return [...construir(p), ...construir([...p].reverse())];
}

/**
 * Polígono de la isócrona calculada con NUESTRO Dijkstra sobre T:
 * casco alrededor de los lugares alcanzables (con un margen que depende del tiempo que les sobra)
 * y del punto hasta donde se llega por cada calle con el tiempo restante.
 */
export function poligonoIsocrona(g: Grafo, alcanzables: Alcanzable[], tMax: number): LngLat[] | null {
  const puntos: LngLat[] = [];
  const tiempos = new Map<string, number>();
  for (const a of alcanzables) {
    const l = g.lugares[a.indice];
    const p = posicion(g, l.id);
    if (!p) continue;
    tiempos.set(l.id, a.tiempo);
    const restante = Math.max(0, tMax - a.tiempo);
    puntos.push(...circulo(p, 0.7 + 2.0 * (restante / Math.max(tMax, 1))));
  }
  for (const c of g.calles) {
    for (const desde of [c.a, c.b]) {
      const t = tiempos.get(desde);
      if (t === undefined || c.t <= 0) continue;
      const frac = Math.min(1, (tMax - t) / c.t);
      if (frac <= 0) continue;
      const tramo = geometriaOrientada(g, c, desde);
      if (tramo.length >= 2) puntos.push(...circulo(interpolar(tramo, frac), 0.5, 12));
    }
  }
  const casco = cascoConvexo(puntos);
  return casco.length >= 3 ? [...casco, casco[0]] : null;
}
