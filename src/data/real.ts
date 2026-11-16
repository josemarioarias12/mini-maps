import type { Calle, Grafo, Lugar } from '../lib/tipos';

/** Formato de src/data/real.json (lo genera scripts/generar-datos.mjs). */
export interface DatosReales {
  meta: { generado: string; fuentes: string[]; avisos: string[]; formulaE: string };
  lugares: { id: string; nombre: string; lat: number; lng: number }[];
  calles: {
    a: string;
    b: string;
    corredor?: string;
    d: number;
    t: number;
    e: number;
    ascenso: number;
    descenso: number;
    geometria: [number, number][];
  }[];
}

/**
 * Proyecta lat/lng al lienzo SVG (1000×620) conservando proporciones
 * (proyección equirrectangular con margen). El mapa real de la Fase 2 usará lat/lng directamente.
 */
export function proyectar(lugares: { id: string; lat: number; lng: number }[]): Map<string, { x: number; y: number }> {
  const lats = lugares.map((l) => l.lat);
  const lngs = lugares.map((l) => l.lng);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const anchoU = Math.max((maxLng - minLng) * k, 1e-9);
  const altoU = Math.max(maxLat - minLat, 1e-9);
  const escala = Math.min(840 / anchoU, 500 / altoU);
  const offX = (1000 - anchoU * escala) / 2;
  const offY = (620 - altoU * escala) / 2 - 10;
  return new Map(
    lugares.map((l) => [l.id, { x: Math.round(offX + (l.lng - minLng) * k * escala), y: Math.round(offY + (maxLat - l.lat) * escala) }]),
  );
}

/** Convierte los datos reales al grafo que usa la lógica matemática. */
export function grafoDesdeReal(r: DatosReales): Grafo {
  const pos = proyectar(r.lugares);
  const lugares: Lugar[] = r.lugares.map((l) => ({ id: l.id, nombre: l.nombre, lat: l.lat, lng: l.lng, ...(pos.get(l.id) ?? { x: 0, y: 0 }) }));
  const calles: Calle[] = r.calles.map((c) => ({ ...c }));
  return { lugares, calles };
}

/** Recalcula x,y (lienzo esquemático) cuando todos los lugares tienen lat/lng; si no, deja el grafo igual. */
export function reproyectar(g: Grafo): Grafo {
  if (!g.lugares.every((l) => l.lat !== undefined && l.lng !== undefined)) return g;
  const pos = proyectar(g.lugares.map((l) => ({ id: l.id, lat: l.lat as number, lng: l.lng as number })));
  return { ...g, lugares: g.lugares.map((l) => ({ ...l, ...(pos.get(l.id) ?? { x: l.x, y: l.y }) })) };
}
