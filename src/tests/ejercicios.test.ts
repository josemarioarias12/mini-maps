import { describe, expect, it } from 'vitest';
import { EJ1_M, EJ1_M2, EJ2_W, EJ3_M3, EJ3_R, resolverEj1, resolverEj2, resolverEj3 } from '../data/ejercicios';

describe('Ejercicios del documento (Avance 1)', () => {
  it('Ejercicio 1: M y M² coinciden con el documento', () => {
    const r = resolverEj1();
    expect(r.M).toEqual(EJ1_M);
    expect(r.M2).toEqual(EJ1_M2);
    expect(r.coincide).toBe(true);
  });

  it('Ejercicio 1: hay 2 recorridos de dos tramos de A a D y 3 de B a B', () => {
    const { M2 } = resolverEj1();
    expect(M2[0][3]).toBe(2);
    expect(M2[1][1]).toBe(3);
  });

  it('Ejercicio 2: la ruta más rápida de A a D es A→B→C→D con 9 minutos', () => {
    const r = resolverEj2();
    expect(r.W).toEqual(EJ2_W);
    expect(r.ruta).toEqual(['A', 'B', 'C', 'D']);
    expect(r.costo).toBe(9);
    expect(r.coincide).toBe(true);
  });

  it('Ejercicio 3: M³ y R coinciden y el grafo es conexo', () => {
    const r = resolverEj3();
    expect(r.M3).toEqual(EJ3_M3);
    expect(r.R).toEqual(EJ3_R);
    expect(r.conexo).toBe(true);
    expect(r.coincide).toBe(true);
  });
});
