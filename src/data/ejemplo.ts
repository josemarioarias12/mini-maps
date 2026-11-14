import type { Calle, Grafo, Lugar } from '../lib/tipos';

/**
 * Dataset de ejemplo: 12 lugares del Gran Área Metropolitana de Costa Rica.
 * Las posiciones en el mapa son esquemáticas y los valores de distancia, tiempo
 * y esfuerzo son ILUSTRATIVOS (diseñados para que la ruta cambie al variar α, β, γ).
 */
const lugares: Lugar[] = [
  { id: 'ALA', nombre: 'Alajuela Centro', x: 110, y: 120 },
  { id: 'SJO', nombre: 'Aeropuerto SJO', x: 250, y: 215 },
  { id: 'HER', nombre: 'Heredia Centro', x: 450, y: 80 },
  { id: 'BEL', nombre: 'Belén', x: 190, y: 335 },
  { id: 'SAN', nombre: 'Santa Ana', x: 140, y: 475 },
  { id: 'ESC', nombre: 'Escazú', x: 330, y: 525 },
  { id: 'SAB', nombre: 'La Sabana', x: 420, y: 360 },
  { id: 'CEN', nombre: 'CENFOTEC (San José)', x: 570, y: 270 },
  { id: 'UCR', nombre: 'San Pedro (UCR)', x: 700, y: 215 },
  { id: 'CUR', nombre: 'Curridabat', x: 760, y: 370 },
  { id: 'TRE', nombre: 'Tres Ríos', x: 840, y: 470 },
  { id: 'CAR', nombre: 'Cartago Centro', x: 900, y: 570 },
];

const calles: Calle[] = [
  { a: 'ALA', b: 'SJO', d: 8.5, t: 14, e: 3 },
  { a: 'ALA', b: 'HER', d: 14, t: 30, e: 4 },
  { a: 'ALA', b: 'BEL', d: 11, t: 26, e: 5 },
  { a: 'SJO', b: 'BEL', d: 6.5, t: 12, e: 3 },
  { a: 'SJO', b: 'HER', d: 13.5, t: 22, e: 4 },
  { a: 'SJO', b: 'SAB', d: 14, t: 34, e: 8 },
  { a: 'HER', b: 'CEN', d: 11, t: 50, e: 9 },
  { a: 'HER', b: 'UCR', d: 15, t: 32, e: 6 },
  { a: 'BEL', b: 'SAN', d: 8, t: 20, e: 4 },
  { a: 'BEL', b: 'SAB', d: 12, t: 28, e: 7 },
  { a: 'SAN', b: 'ESC', d: 6, t: 16, e: 3 },
  { a: 'ESC', b: 'SAB', d: 7.5, t: 20, e: 5 },
  { a: 'SAB', b: 'CEN', d: 4.5, t: 18, e: 7 },
  { a: 'ESC', b: 'CEN', d: 10, t: 32, e: 6 },
  { a: 'CEN', b: 'UCR', d: 4, t: 16, e: 7 },
  { a: 'CEN', b: 'CUR', d: 8, t: 28, e: 6 },
  { a: 'UCR', b: 'CUR', d: 4, t: 11, e: 3 },
  { a: 'UCR', b: 'TRE', d: 10, t: 20, e: 3 },
  { a: 'CUR', b: 'TRE', d: 5, t: 12, e: 2 },
  { a: 'TRE', b: 'CAR', d: 11, t: 16, e: 2 },
  { a: 'CUR', b: 'CAR', d: 11.5, t: 34, e: 9 },
];

export const GRAFO_EJEMPLO: Grafo = { lugares, calles };

/** Copia profunda para poder editar sin modificar el dataset original. */
export function copiarGrafo(g: Grafo): Grafo {
  return { lugares: g.lugares.map((l) => ({ ...l })), calles: g.calles.map((c) => ({ ...c })) };
}
