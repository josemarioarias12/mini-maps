import type { Grafo } from '../lib/tipos';

/**
 * Grafo pequeño para las demostraciones del landing.
 * Diseñado para que A→F tenga una ruta distinta según el criterio:
 *   distancia → A-B-D-F (9 km) · tiempo → A-E-F (11 min) · esfuerzo → A-C-E-F (E = 9)
 */
export const GRAFO_DEMO: Grafo = {
  lugares: [
    { id: 'A', nombre: 'A', x: 40, y: 120 },
    { id: 'B', nombre: 'B', x: 120, y: 36 },
    { id: 'C', nombre: 'C', x: 120, y: 204 },
    { id: 'D', nombre: 'D', x: 250, y: 36 },
    { id: 'E', nombre: 'E', x: 250, y: 204 },
    { id: 'F', nombre: 'F', x: 350, y: 120 },
  ],
  calles: [
    { a: 'A', b: 'B', d: 3, t: 8, e: 6 },
    { a: 'B', b: 'D', d: 3, t: 9, e: 6 },
    { a: 'D', b: 'F', d: 3, t: 8, e: 6 },
    { a: 'A', b: 'C', d: 4, t: 5, e: 3 },
    { a: 'C', b: 'E', d: 5, t: 6, e: 3 },
    { a: 'E', b: 'F', d: 5, t: 5, e: 3 },
    { a: 'A', b: 'E', d: 8, t: 6, e: 8 },
  ],
};
