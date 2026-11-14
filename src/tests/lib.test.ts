import { describe, expect, it } from 'vitest';
import { GRAFO_EJEMPLO } from '../data/ejemplo';
import type { Grafo } from '../lib/tipos';
import { diagonalEnCero, esSimetrica, matrizAdyacencia, normalizarPesos } from '../lib/matrices';
import { dijkstra, rutaMinima } from '../lib/dijkstra';
import { construirModelo, calcularRutas } from '../lib/modelo';
import { isocrona } from '../lib/isocronas';
import { accesibilidad, componentes, esConexo, lugaresAislados, recorridos } from '../lib/accesibilidad';

/** Grafo con un lugar desconectado (Z). */
const desconectado: Grafo = {
  lugares: [
    { id: 'A', nombre: 'A', x: 0, y: 0 },
    { id: 'B', nombre: 'B', x: 0, y: 0 },
    { id: 'Z', nombre: 'Z', x: 0, y: 0 },
  ],
  calles: [{ a: 'A', b: 'B', d: 1, t: 2, e: 3 }],
};

describe('Matriz de adyacencia', () => {
  it('es simétrica y con diagonal en cero', () => {
    const M = matrizAdyacencia(GRAFO_EJEMPLO);
    expect(esSimetrica(M)).toBe(true);
    expect(diagonalEnCero(M)).toBe(true);
  });
});

describe('Dijkstra', () => {
  it('devuelve ∞ y ruta nula si el nodo está desconectado', () => {
    const m = construirModelo(desconectado, { alfa: 1, beta: 0, gamma: 0 });
    expect(dijkstra(m.T, 0).dist[2]).toBe(Infinity);
    const r = rutaMinima(m.T, 0, 2);
    expect(r.costo).toBe(Infinity);
    expect(r.ruta).toBeNull();
  });

  it('con α=1, β=0, γ=0 la ruta personalizada tiene la distancia mínima pura (todos los pares)', () => {
    const m = construirModelo(GRAFO_EJEMPLO, { alfa: 1, beta: 0, gamma: 0 });
    const n = GRAFO_EJEMPLO.lugares.length;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const r = calcularRutas(GRAFO_EJEMPLO, m, i, j);
        expect(r.personalizada.totales?.d).toBeCloseTo(r.distancia.totales?.d ?? NaN, 9);
      }
  });

  it('los pesos se normalizan para sumar 1 y se rechazan los inválidos', () => {
    expect(normalizarPesos({ alfa: 2, beta: 1, gamma: 1 })).toEqual({ alfa: 0.5, beta: 0.25, gamma: 0.25 });
    expect(normalizarPesos({ alfa: 0, beta: 0, gamma: 0 })).toBeNull();
    expect(normalizarPesos({ alfa: -1, beta: 2, gamma: 0 })).toBeNull();
  });
});

describe('Isócronas', () => {
  it('con tiempo máximo 0 solo devuelve el origen', () => {
    const m = construirModelo(GRAFO_EJEMPLO, { alfa: 0, beta: 1, gamma: 0 });
    const r = isocrona(m.T, 7, 0);
    expect(r).toEqual([{ indice: 7, tiempo: 0 }]);
  });

  it('con tiempo suficiente alcanza todos los lugares', () => {
    const m = construirModelo(GRAFO_EJEMPLO, { alfa: 0, beta: 1, gamma: 0 });
    expect(isocrona(m.T, 0, 1000)).toHaveLength(GRAFO_EJEMPLO.lugares.length);
  });
});

describe('Accesibilidad y potencias', () => {
  it('detecta lugares aislados y grafo no conexo', () => {
    const M = matrizAdyacencia(desconectado);
    expect(lugaresAislados(M)).toEqual([2]);
    expect(esConexo(accesibilidad(M))).toBe(false);
    expect(componentes(accesibilidad(M))).toEqual([[0, 1], [2]]);
  });

  it('el dataset de ejemplo es conexo', () => {
    expect(esConexo(accesibilidad(matrizAdyacencia(GRAFO_EJEMPLO)))).toBe(true);
  });

  it('la cantidad de recorridos listados coincide con M^k', () => {
    const M = matrizAdyacencia(GRAFO_EJEMPLO);
    expect(recorridos(M, 0, 0, 2).length).toBe(M[0].reduce((s, v) => s + v, 0));
  });
});
