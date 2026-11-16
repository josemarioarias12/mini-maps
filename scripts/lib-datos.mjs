// Funciones puras del generador de datos (sin red ni archivos): se pueden probar con Vitest.

export const R_TIERRA_M = 6371008.8;
const rad = (g) => (g * Math.PI) / 180;
export const acotar = (x, min, max) => Math.min(max, Math.max(min, x));

/** Distancia en metros entre dos puntos [lng, lat] (fórmula de Haversine). */
export function haversineM([lng1, lat1], [lng2, lat2]) {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_TIERRA_M * Math.asin(Math.sqrt(h));
}

/** Longitud total (m) de una polilínea [[lng, lat], ...]. */
export function longitudM(coords) {
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += haversineM(coords[i - 1], coords[i]);
  return total;
}

/** Remuestrea la polilínea con puntos equiespaciados cada `pasoM` metros (incluye extremos). */
export function remuestrear(coords, pasoM = 200) {
  if (coords.length < 2) return [...coords];
  const salida = [coords[0]];
  let siguiente = pasoM;
  let acumulado = 0;
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1];
    const b = coords[i];
    const seg = haversineM(a, b);
    while (seg > 0 && acumulado + seg >= siguiente) {
      const f = (siguiente - acumulado) / seg;
      salida.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
      siguiente += pasoM;
    }
    acumulado += seg;
  }
  const ultimo = coords[coords.length - 1];
  const previo = salida[salida.length - 1];
  if (previo[0] !== ultimo[0] || previo[1] !== ultimo[1]) salida.push(ultimo);
  return salida;
}

/** Distancia (m) de un punto a un segmento, con proyección plana local. */
function distPuntoSegmentoM(p, a, b) {
  const k = Math.cos(rad(a[1]));
  const x = (q) => (q[0] - a[0]) * k * 111320;
  const y = (q) => (q[1] - a[1]) * 110574;
  const [px, py, bx, by] = [x(p), y(p), x(b), y(b)];
  const largo2 = bx * bx + by * by;
  const t = largo2 === 0 ? 0 : acotar((px * bx + py * by) / largo2, 0, 1);
  return Math.hypot(px - t * bx, py - t * by);
}

function douglasPeucker(coords, tolM) {
  const n = coords.length;
  if (n < 3) return [...coords];
  const mantener = new Array(n).fill(false);
  mantener[0] = mantener[n - 1] = true;
  const pila = [[0, n - 1]];
  while (pila.length) {
    const [ini, fin] = pila.pop();
    let maxD = 0;
    let idx = -1;
    for (let i = ini + 1; i < fin; i++) {
      const d = distPuntoSegmentoM(coords[i], coords[ini], coords[fin]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx !== -1 && maxD > tolM) {
      mantener[idx] = true;
      pila.push([ini, idx], [idx, fin]);
    }
  }
  return coords.filter((_, i) => mantener[i]);
}

/** Simplifica la polilínea a un máximo de `max` puntos (Douglas–Peucker con tolerancia creciente). */
export function simplificar(coords, max = 60) {
  let tol = 2;
  let res = douglasPeucker(coords, tol);
  while (res.length > max) {
    tol *= 1.6;
    res = douglasPeucker(coords, tol);
  }
  return res;
}

/** Ascenso y descenso acumulados (m) a partir de altitudes muestreadas; suaviza con media móvil de 3. */
export function perfilAltimetrico(alturas) {
  const suave = alturas.map((_, i) => {
    const v = [alturas[i - 1], alturas[i], alturas[i + 1]].filter((x) => x !== undefined);
    return v.reduce((s, x) => s + x, 0) / v.length;
  });
  let ascenso = 0;
  let descenso = 0;
  for (let i = 1; i < suave.length; i++) {
    const delta = suave[i] - suave[i - 1];
    if (delta > 0) ascenso += delta;
    else descenso -= delta;
  }
  return { ascenso, descenso };
}

/**
 * Esfuerzo E ∈ {1,…,10} (ESTIMACIÓN):
 *   E = redondeo( 1 + Ep + Es + Ec ), acotado a [1, 10]
 *   Ep = 4·min(g/6, 1)             g = (ascenso+descenso)/distancia·100  [% de desnivel acumulado]
 *   Es = 2·min((sin−1)/0.6, 1)     sin = distancia de ruta / distancia en línea recta
 *   Ec = 3·min((c−1)/0.6, 1)       c = factor de congestión del corredor (1.0–1.6, estimado a mano)
 */
export function calcularEsfuerzo({ ascenso, descenso, distanciaM, lineaRectaM, congestion }) {
  const g = distanciaM > 0 ? ((ascenso + descenso) / distanciaM) * 100 : 0;
  const sinuosidad = lineaRectaM > 0 ? distanciaM / lineaRectaM : 1;
  const ep = 4 * acotar(g / 6, 0, 1);
  const es = 2 * acotar((sinuosidad - 1) / 0.6, 0, 1);
  const ec = 3 * acotar((congestion - 1) / 0.6, 0, 1);
  return { valor: Math.round(acotar(1 + ep + es + ec, 1, 10)), g, sinuosidad, ep, es, ec };
}

/** ¿El grafo (lista de ids y de aristas) es conexo? Recorrido en anchura. */
export function esConexoLista(ids, calles) {
  if (ids.length === 0) return true;
  const vecinos = new Map(ids.map((id) => [id, []]));
  for (const c of calles) {
    vecinos.get(c.a)?.push(c.b);
    vecinos.get(c.b)?.push(c.a);
  }
  const visto = new Set([ids[0]]);
  const cola = [ids[0]];
  while (cola.length) {
    for (const v of vecinos.get(cola.shift()) ?? []) {
      if (!visto.has(v)) {
        visto.add(v);
        cola.push(v);
      }
    }
  }
  return visto.size === ids.length;
}

/** Valida el resultado final. Devuelve una lista de errores (vacía = todo correcto). */
export function validar({ lugares, calles }) {
  const errores = [];
  const porId = new Map(lugares.map((l) => [l.id, l]));
  if (porId.size !== lugares.length) errores.push('Hay ids de lugares repetidos.');
  const vistas = new Set();
  for (const c of calles) {
    const nombre = `${c.a}–${c.b}`;
    const A = porId.get(c.a);
    const B = porId.get(c.b);
    if (!A || !B) { errores.push(`${nombre}: referencia a un lugar inexistente.`); continue; }
    if (c.a === c.b) errores.push(`${nombre}: una calle no puede unir un lugar consigo mismo.`);
    const clave = [c.a, c.b].sort().join('|');
    if (vistas.has(clave)) errores.push(`${nombre}: calle duplicada.`);
    vistas.add(clave);
    const rectaKm = haversineM([A.lng, A.lat], [B.lng, B.lat]) / 1000;
    if (!(c.d > 0) || !(c.t > 0)) errores.push(`${nombre}: distancia o tiempo no positivos.`);
    if (c.d < rectaKm * 0.98) errores.push(`${nombre}: la distancia por calle (${c.d} km) es menor que la línea recta (${rectaKm.toFixed(2)} km).`);
    if (c.d > 80) errores.push(`${nombre}: distancia sospechosa (${c.d} km).`);
    if (!Number.isInteger(c.e) || c.e < 1 || c.e > 10) errores.push(`${nombre}: esfuerzo fuera de [1,10] (${c.e}).`);
  }
  if (!esConexoLista(lugares.map((l) => l.id), calles)) errores.push('El grafo no es conexo: hay lugares aislados.');
  const maxAristas = (lugares.length * (lugares.length - 1)) / 2;
  if (lugares.length >= 8 && calles.length > maxAristas * 0.5) errores.push('El grafo no es disperso (más de la mitad de las aristas posibles).');
  return errores;
}
