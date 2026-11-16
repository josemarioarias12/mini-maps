import { describe, expect, it } from 'vitest';
import config from '../../scripts/lugares.json';
import {
  calcularEsfuerzo,
  esConexoLista,
  haversineM,
  longitudM,
  perfilAltimetrico,
  remuestrear,
  simplificar,
  validar,
} from '../../scripts/lib-datos.mjs';
import { grafoDesdeReal, proyectar } from '../data/real';
import type { DatosReales } from '../data/real';
import { matrizAdyacencia, esSimetrica } from '../lib/matrices';
import { accesibilidad, esConexo } from '../lib/accesibilidad';

describe('lib-datos: geometría', () => {
  it('haversine: 1° de latitud ≈ 111 km', () => {
    expect(haversineM([0, 0], [0, 1]) / 1000).toBeCloseTo(111.2, 0);
  });

  it('remuestrear conserva extremos y la longitud total', () => {
    const linea: [number, number][] = [[-84.1, 9.9], [-84.05, 9.92], [-84.0, 9.9]];
    const r = remuestrear(linea, 200);
    expect(r[0]).toEqual(linea[0]);
    expect(r[r.length - 1]).toEqual(linea[2]);
    expect(longitudM(r)).toBeLessThanOrEqual(longitudM(linea) + 1);
    expect(longitudM(r)).toBeGreaterThan(longitudM(linea) * 0.98);
  });

  it('simplificar respeta el máximo de puntos y conserva extremos', () => {
    const zigzag: [number, number][] = Array.from({ length: 400 }, (_, i) => [-84 + i * 0.0005, 9.9 + Math.sin(i / 5) * 0.002]);
    const s = simplificar(zigzag, 60);
    expect(s.length).toBeLessThanOrEqual(60);
    expect(s[0]).toEqual(zigzag[0]);
    expect(s[s.length - 1]).toEqual(zigzag[zigzag.length - 1]);
  });
});

describe('lib-datos: altimetría y esfuerzo', () => {
  it('terreno plano no tiene ascenso ni descenso', () => {
    expect(perfilAltimetrico([1000, 1000, 1000, 1000])).toEqual({ ascenso: 0, descenso: 0 });
  });

  it('una subida constante acumula ascenso y no descenso', () => {
    const p = perfilAltimetrico([0, 10, 20, 30, 40]);
    expect(p.ascenso).toBeGreaterThan(25);
    expect(p.descenso).toBe(0);
  });

  it('el esfuerzo se mantiene en [1, 10] y es el mínimo en condiciones ideales', () => {
    const facil = calcularEsfuerzo({ ascenso: 0, descenso: 0, distanciaM: 10000, lineaRectaM: 10000, congestion: 1 });
    const duro = calcularEsfuerzo({ ascenso: 5000, descenso: 5000, distanciaM: 10000, lineaRectaM: 2000, congestion: 3 });
    expect(facil.valor).toBe(1);
    expect(duro.valor).toBe(10);
  });

  it('más pendiente, sinuosidad o congestión nunca reducen el esfuerzo', () => {
    const base = { ascenso: 100, descenso: 100, distanciaM: 10000, lineaRectaM: 8000, congestion: 1.2 };
    const e0 = calcularEsfuerzo(base).valor;
    expect(calcularEsfuerzo({ ...base, ascenso: 400 }).valor).toBeGreaterThanOrEqual(e0);
    expect(calcularEsfuerzo({ ...base, lineaRectaM: 5000 }).valor).toBeGreaterThanOrEqual(e0);
    expect(calcularEsfuerzo({ ...base, congestion: 1.6 }).valor).toBeGreaterThanOrEqual(e0);
  });
});

describe('lib-datos: validación', () => {
  const lugares = [
    { id: 'A', lat: 9.9, lng: -84.1 },
    { id: 'B', lat: 9.95, lng: -84.1 },
    { id: 'C', lat: 10.0, lng: -84.1 },
  ];
  it('acepta datos correctos', () => {
    expect(validar({ lugares, calles: [{ a: 'A', b: 'B', d: 6, t: 10, e: 3 }, { a: 'B', b: 'C', d: 6, t: 10, e: 3 }] })).toEqual([]);
  });
  it('detecta grafo no conexo, distancia menor que la línea recta y esfuerzo fuera de rango', () => {
    const errores = validar({ lugares, calles: [{ a: 'A', b: 'B', d: 1, t: 10, e: 11 }] });
    expect(errores.some((e) => e.includes('no es conexo'))).toBe(true);
    expect(errores.some((e) => e.includes('menor que la línea recta'))).toBe(true);
    expect(errores.some((e) => e.includes('esfuerzo fuera de'))).toBe(true);
  });
});

describe('scripts/lugares.json (configuración de entrada)', () => {
  const ids = config.lugares.map((l) => l.id);

  it('tiene ids únicos y coordenadas dentro de la zona metropolitana de Costa Rica', () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of config.lugares) {
      expect(l.lat).toBeGreaterThan(9.7);
      expect(l.lat).toBeLessThan(10.2);
      expect(l.lng).toBeGreaterThan(-84.4);
      expect(l.lng).toBeLessThan(-83.7);
    }
  });

  it('las calles referencian lugares existentes, sin duplicados y con congestión en [1, 1.6]', () => {
    const vistas = new Set<string>();
    for (const c of config.calles) {
      expect(ids).toContain(c.a);
      expect(ids).toContain(c.b);
      expect(c.a).not.toBe(c.b);
      const k = [c.a, c.b].sort().join('|');
      expect(vistas.has(k)).toBe(false);
      vistas.add(k);
      expect(c.congestion).toBeGreaterThanOrEqual(1);
      expect(c.congestion).toBeLessThanOrEqual(1.6);
    }
  });

  it('el grafo es conexo, disperso y las calles unen lugares cercanos (≤ 30 km en línea recta)', () => {
    expect(esConexoLista(ids, config.calles)).toBe(true);
    expect(config.calles.length).toBeLessThan((ids.length * (ids.length - 1)) / 4);
    const por = new Map(config.lugares.map((l) => [l.id, l]));
    for (const c of config.calles) {
      const A = por.get(c.a)!;
      const B = por.get(c.b)!;
      expect(haversineM([A.lng, A.lat], [B.lng, B.lat]) / 1000).toBeLessThanOrEqual(30);
    }
  });

  it('incluye CENFOTEC y los lugares usados por defecto en la app', () => {
    expect(ids).toEqual(expect.arrayContaining(['CEN', 'SAN', 'CAR']));
  });
});

describe('Conversión de datos reales a grafo', () => {
  const real: DatosReales = {
    meta: { generado: '2026-01-01', fuentes: [], avisos: [], formulaE: '' },
    lugares: [
      { id: 'A', nombre: 'A', lat: 9.9, lng: -84.1 },
      { id: 'B', nombre: 'B', lat: 9.95, lng: -84.0 },
      { id: 'C', nombre: 'C', lat: 9.85, lng: -83.95 },
    ],
    calles: [
      { a: 'A', b: 'B', d: 12, t: 20, e: 4, ascenso: 50, descenso: 20, geometria: [[-84.1, 9.9], [-84.0, 9.95]] },
      { a: 'B', b: 'C', d: 15, t: 25, e: 5, ascenso: 10, descenso: 90, geometria: [[-84.0, 9.95], [-83.95, 9.85]] },
    ],
  };

  it('proyecta dentro del lienzo 1000×620 conservando el orden norte-sur y oeste-este', () => {
    const pos = proyectar(real.lugares);
    for (const { x, y } of pos.values()) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1000);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(620);
    }
    expect(pos.get('B')!.y).toBeLessThan(pos.get('A')!.y); // B está más al norte
    expect(pos.get('C')!.x).toBeGreaterThan(pos.get('A')!.x); // C está más al este
  });

  it('el grafo resultante es simétrico, conexo y conserva lat/lng', () => {
    const g = grafoDesdeReal(real);
    const M = matrizAdyacencia(g);
    expect(esSimetrica(M)).toBe(true);
    expect(esConexo(accesibilidad(M))).toBe(true);
    expect(g.lugares[0].lat).toBe(9.9);
    expect(g.calles[0].geometria).toHaveLength(2);
  });
});

describe('src/data/real.json (si ya se generó con npm run datos)', () => {
  const mods = import.meta.glob<DatosReales>('../data/real.json', { eager: true, import: 'default' });
  const real = Object.values(mods)[0];

  it.skipIf(!real)('pasa la validación completa del generador', () => {
    expect(validar(real)).toEqual([]);
  });

  it.skipIf(!real)('es simétrico y conexo con la matriz de adyacencia del proyecto', () => {
    const M = matrizAdyacencia(grafoDesdeReal(real));
    expect(esSimetrica(M)).toBe(true);
    expect(esConexo(accesibilidad(M))).toBe(true);
  });
});
