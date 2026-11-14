import type { Matriz } from './tipos';
import { dijkstra } from './dijkstra';

export interface Alcanzable {
  indice: number;
  tiempo: number; // tiempo mínimo desde el origen (min)
}

/**
 * Isócrona: todos los lugares cuyo tiempo mínimo desde el origen es ≤ tMax.
 * T es la matriz de tiempos (∞ sin conexión, 0 en la diagonal).
 */
export function isocrona(T: Matriz, origen: number, tMax: number): Alcanzable[] {
  if (origen < 0 || origen >= T.length) return [];
  const { dist } = dijkstra(T, origen);
  return dist
    .map((tiempo, indice) => ({ indice, tiempo }))
    .filter((a) => a.tiempo <= tMax)
    .sort((a, b) => a.tiempo - b.tiempo);
}
