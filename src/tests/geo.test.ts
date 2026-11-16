import { describe, expect, it } from 'vitest';
import { GRAFO_EJEMPLO } from '../data/ejemplo';
import { cascoConvexo, distanciaKm, geometriaOrientada, interpolar, limites, poligonoIsocrona, tieneCoordenadas, trazarRuta, trozoHasta } from '../lib/geo';
import type { LngLat } from '../lib/geo';
import { indicaciones } from '../lib/indicaciones';
import { EJERCICIOS } from '../data/ejercicios';
import { construirModelo } from '../lib/modelo';
import { isocrona } from '../lib/isocronas';
import { indiceDe } from '../lib/matrices';
import type { Grafo } from '../lib/tipos';

const g: Grafo = {
  lugares: [
    { id: 'A', nombre: 'A', x: 0, y: 0, lat: 9.9, lng: -84.1 },
    { id: 'B', nombre: 'B', x: 0, y: 0, lat: 9.95, lng: -84.05 },
    { id: 'C', nombre: 'C', x: 0, y: 0, lat: 9.9, lng: -84.0 },
  ],
  calles: [
    { a: 'A', b: 'B', d: 7, t: 10, e: 3, corredor: 'Ruta 1', geometria: [[-84.1, 9.9], [-84.08, 9.93], [-84.05, 9.95]] },
    { a: 'C', b: 'B', d: 7, t: 12, e: 4, geometria: [[-84.0, 9.9], [-84.05, 9.95]] },
  ],
};

describe('Geometría del mapa', () => {
  it('el dataset ilustrativo tiene coordenadas; los ejercicios A–D no', () => {
    expect(tieneCoordenadas(GRAFO_EJEMPLO)).toBe(true);
    expect(tieneCoordenadas(EJERCICIOS[0].grafo)).toBe(false);
  });

  it('orienta el trazado real según el lugar de salida', () => {
    const ida = geometriaOrientada(g, g.calles[0], 'A');
    const vuelta = geometriaOrientada(g, g.calles[0], 'B');
    expect(ida[0]).toEqual([-84.1, 9.9]);
    expect(vuelta[0]).toEqual([-84.05, 9.95]);
    expect(vuelta).toHaveLength(ida.length);
  });

  it('sin trazado real, la calle es una recta entre los dos lugares', () => {
    expect(geometriaOrientada(g, { a: 'A', b: 'C', d: 1, t: 1, e: 1 }, 'A')).toEqual([[-84.1, 9.9], [-84.0, 9.9]]);
  });

  it('trazarRuta une los tramos sin repetir el punto de empalme', () => {
    const r = trazarRuta(g, [0, 1, 2]);
    expect(r[0]).toEqual([-84.1, 9.9]);
    expect(r[r.length - 1]).toEqual([-84.0, 9.9]);
    expect(r).toHaveLength(3 + 2 - 1);
  });

  it('interpolar y trozoHasta recorren la ruta de 0 a 1', () => {
    const ruta: LngLat[] = [[-84.1, 9.9], [-84.0, 9.9]];
    expect(interpolar(ruta, 0)).toEqual(ruta[0]);
    expect(interpolar(ruta, 1)).toEqual(ruta[1]);
    expect(interpolar(ruta, 0.5)[0]).toBeCloseTo(-84.05, 6);
    expect(trozoHasta(ruta, 1)).toEqual(ruta);
    const mitad = trozoHasta(ruta, 0.5);
    expect(mitad[mitad.length - 1][0]).toBeCloseTo(-84.05, 6);
  });

  it('distanciaKm: 1° de latitud ≈ 111 km', () => {
    expect(distanciaKm([0, 0], [0, 1])).toBeCloseTo(111.2, 0);
  });

  it('limites devuelve [oeste, sur, este, norte]', () => {
    expect(limites([[-84.1, 9.9], [-84.0, 9.95]])).toEqual([-84.1, 9.9, -84.0, 9.95]);
    expect(limites([])).toBeNull();
  });

  it('el casco convexo ignora los puntos interiores', () => {
    const c = cascoConvexo([[0, 0], [2, 0], [2, 2], [0, 2], [1, 1]]);
    expect(c).toHaveLength(4);
  });
});

describe('Isócrona en el mapa', () => {
  const modelo = construirModelo(GRAFO_EJEMPLO, { alfa: 0, beta: 1, gamma: 0 });
  const oi = indiceDe(GRAFO_EJEMPLO, 'CEN');

  it('devuelve un polígono cerrado alrededor de los lugares alcanzables', () => {
    const p = poligonoIsocrona(GRAFO_EJEMPLO, isocrona(modelo.T, oi, 30), 30);
    expect(p).not.toBeNull();
    expect(p![0]).toEqual(p![p!.length - 1]);
  });

  it('con tiempo 0 solo rodea al origen (un lugar → polígono pequeño)', () => {
    const grande = poligonoIsocrona(GRAFO_EJEMPLO, isocrona(modelo.T, oi, 40), 40)!;
    const cero = poligonoIsocrona(GRAFO_EJEMPLO, isocrona(modelo.T, oi, 0), 0)!;
    const ancho = (p: LngLat[]) => Math.max(...p.map((q) => q[0])) - Math.min(...p.map((q) => q[0]));
    expect(ancho(cero)).toBeLessThan(ancho(grande));
  });
});

describe('Indicaciones paso a paso', () => {
  it('salida, un paso por calle y llegada, con km, min y corredor', () => {
    const pasos = indicaciones(g, [0, 1, 2]);
    expect(pasos).toHaveLength(4);
    expect(pasos[0].texto).toBe('Salga de A');
    expect(pasos[1]).toEqual({ texto: 'Continúe hacia B', detalle: '7 km · 10 min · por Ruta 1' });
    expect(pasos[3].texto).toBe('Llegó a C');
  });

  it('una ruta de un solo lugar no genera indicaciones', () => {
    expect(indicaciones(g, [0])).toEqual([]);
  });
});
