import type { Calle, Grafo, Matriz, Pesos } from '../lib/tipos';
import { iguales, matrizAdyacencia, matrizPonderada, potencia, sumar, identidad } from '../lib/matrices';
import { accesibilidad, esConexo } from '../lib/accesibilidad';
import { rutaMinima } from '../lib/dijkstra';
import type { PasoDijkstra } from '../lib/dijkstra';

/** Resultados esperados, tomados del documento del Avance 1. */
export const EJ1_M: Matriz = [[0, 1, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 1, 0]];
export const EJ1_M2: Matriz = [[2, 1, 1, 2], [1, 3, 2, 1], [1, 2, 3, 1], [2, 1, 1, 2]];
export const EJ2_W: Matriz = [[0, 4, 7, Infinity], [4, 0, 2, 8], [7, 2, 0, 3], [Infinity, 8, 3, 0]];
export const EJ3_M: Matriz = [[0, 1, 0, 0], [1, 0, 1, 0], [0, 1, 0, 1], [0, 0, 1, 0]];
export const EJ3_M3: Matriz = [[0, 2, 0, 1], [2, 0, 3, 0], [0, 3, 0, 2], [1, 0, 2, 0]];
export const EJ3_R: Matriz = [[2, 3, 1, 1], [3, 3, 4, 1], [1, 4, 3, 3], [1, 1, 3, 2]];

const NOMBRES = ['A', 'B', 'C', 'D'];

/** Construye un grafo con pesos unitarios a partir de una lista de aristas. */
function grafoDesdeAristas(aristas: [string, string][], pos: [number, number][]): Grafo {
  const calles: Calle[] = aristas.map(([a, b]) => ({ a, b, d: 1, t: 1, e: 1 }));
  return { lugares: NOMBRES.map((id, i) => ({ id, nombre: `Lugar ${id}`, x: pos[i][0], y: pos[i][1] })), calles };
}

/** Construye un grafo a partir de una matriz de tiempos W (∞ = sin calle). */
function grafoDesdeW(W: Matriz, pos: [number, number][]): Grafo {
  const calles: Calle[] = [];
  W.forEach((fila, i) =>
    fila.forEach((v, j) => {
      if (j > i && Number.isFinite(v)) calles.push({ a: NOMBRES[i], b: NOMBRES[j], d: v, t: v, e: 1 });
    }),
  );
  return { lugares: NOMBRES.map((id, i) => ({ id, nombre: `Lugar ${id}`, x: pos[i][0], y: pos[i][1] })), calles };
}

export interface Ejercicio {
  id: 1 | 2 | 3;
  titulo: string;
  descripcion: string;
  grafo: Grafo;
  origen: string;
  destino: string;
  pesos: Pesos;
}

export const EJERCICIOS: Ejercicio[] = [
  {
    id: 1,
    titulo: 'Ejercicio 1: matriz de adyacencia y recorridos de dos tramos',
    descripcion: 'Grafo A, B, C, D con aristas (A,B), (A,C), (B,D), (C,D), (B,C). Se calcula M² para contar recorridos de exactamente dos tramos.',
    grafo: grafoDesdeAristas([['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['B', 'C']], [[500, 90], [300, 310], [700, 310], [500, 530]]),
    origen: 'A',
    destino: 'D',
    pesos: { alfa: 1, beta: 1, gamma: 1 },
  },
  {
    id: 2,
    titulo: 'Ejercicio 2: ruta más rápida (Dijkstra)',
    descripcion: 'Matriz de tiempos W con ∞ donde no hay conexión directa. Se busca la ruta más rápida de A a D.',
    grafo: grafoDesdeW(EJ2_W, [[170, 170], [470, 120], [470, 470], [800, 400]]),
    origen: 'A',
    destino: 'D',
    pesos: { alfa: 0, beta: 1, gamma: 0 },
  },
  {
    id: 3,
    titulo: 'Ejercicio 3: accesibilidad R = I + M + M² + M³',
    descripcion: 'Grafo lineal A–B–C–D. Se calculan M³ y la matriz de accesibilidad R para decidir si el grafo es conexo.',
    grafo: grafoDesdeAristas([['A', 'B'], ['B', 'C'], ['C', 'D']], [[130, 310], [370, 310], [630, 310], [870, 310]]),
    origen: 'A',
    destino: 'D',
    pesos: { alfa: 1, beta: 1, gamma: 1 },
  },
];

/** Calcula el ejercicio 1 con el programa y lo compara con el documento. */
export function resolverEj1(): { M: Matriz; M2: Matriz; coincide: boolean } {
  const M = matrizAdyacencia(EJERCICIOS[0].grafo);
  const M2 = potencia(M, 2);
  return { M, M2, coincide: iguales(M, EJ1_M) && iguales(M2, EJ1_M2) };
}

/** Calcula el ejercicio 2 con el programa y lo compara con el documento. */
export function resolverEj2(): { W: Matriz; ruta: string[]; costo: number; pasos: PasoDijkstra[]; coincide: boolean } {
  const W = matrizPonderada(EJERCICIOS[1].grafo, 't');
  const r = rutaMinima(W, 0, 3);
  const ruta = (r.ruta ?? []).map((i) => NOMBRES[i]);
  return { W, ruta, costo: r.costo, pasos: r.pasos, coincide: iguales(W, EJ2_W) && ruta.join('') === 'ABCD' && r.costo === 9 };
}

/** Calcula el ejercicio 3 con el programa y lo compara con el documento. */
export function resolverEj3(): { M: Matriz; M3: Matriz; R: Matriz; conexo: boolean; coincide: boolean } {
  const M = matrizAdyacencia(EJERCICIOS[2].grafo);
  const M3 = potencia(M, 3);
  const R = accesibilidad(M);
  const Rdirecta = sumar(sumar(identidad(4), M), sumar(potencia(M, 2), M3));
  const conexo = esConexo(R);
  return { M, M3, R, conexo, coincide: iguales(M, EJ3_M) && iguales(M3, EJ3_M3) && iguales(R, EJ3_R) && iguales(R, Rdirecta) && conexo };
}
