import type { Grafo, Matriz, Pesos } from './tipos';
import { combinacionLineal, matrizAdyacencia, matrizPonderada, normalizar } from './matrices';
import { rutaMinima, totalesRuta } from './dijkstra';
import type { PasoDijkstra } from './dijkstra';

/** Todas las matrices del modelo para un grafo y unos pesos dados. */
export interface Modelo {
  M: Matriz;
  D: Matriz;
  T: Matriz;
  E: Matriz;
  Dn: Matriz;
  Tn: Matriz;
  En: Matriz;
  C: Matriz;
}

export function construirModelo(g: Grafo, pesos: Pesos): Modelo {
  const D = matrizPonderada(g, 'd');
  const T = matrizPonderada(g, 't');
  const E = matrizPonderada(g, 'e');
  const Dn = normalizar(D);
  const Tn = normalizar(T);
  const En = normalizar(E);
  return { M: matrizAdyacencia(g), D, T, E, Dn, Tn, En, C: combinacionLineal(Dn, Tn, En, pesos) };
}

export interface RutaCalculada {
  ruta: number[] | null;
  costo: number;
  totales: { d: number; t: number; e: number } | null;
  pasos: PasoDijkstra[];
}

export interface Rutas {
  personalizada: RutaCalculada;
  distancia: RutaCalculada;
  tiempo: RutaCalculada;
  esfuerzo: RutaCalculada;
}

function calcular(g: Grafo, W: Matriz, o: number, d: number): RutaCalculada {
  const r = rutaMinima(W, o, d);
  return { ...r, totales: r.ruta ? totalesRuta(g, r.ruta) : null };
}

/** Calcula la ruta personalizada (sobre C) y las tres rutas "puras". */
export function calcularRutas(g: Grafo, m: Modelo, o: number, d: number): Rutas {
  return {
    personalizada: calcular(g, m.C, o, d),
    distancia: calcular(g, m.D, o, d),
    tiempo: calcular(g, m.T, o, d),
    esfuerzo: calcular(g, m.E, o, d),
  };
}
