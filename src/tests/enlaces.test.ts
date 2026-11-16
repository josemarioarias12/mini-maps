import { describe, expect, it } from 'vitest';
import { crearEnlace, leerEnlace } from '../lib/enlaces';
import { CONTROLES_EQUILIBRADOS, controlesAPesos, controlesAPesosCrudos, pesosAControles } from '../lib/controles';

const IDS = ['CEN', 'CAR', 'SAN'];

describe('Enlaces profundos (/mapa?o=…&d=…&a=…&b=…&g=…)', () => {
  it('lee origen, destino y pesos', () => {
    expect(leerEnlace('o=CEN&d=CAR&a=40&b=40&g=20', IDS)).toEqual({ origen: 'CEN', destino: 'CAR', controles: { corta: 40, rapido: 40, tranquilo: 20 } });
  });

  it('acepta minúsculas y rechaza lugares que no existen', () => {
    expect(leerEnlace('o=cen&d=XXX', IDS)).toEqual({ origen: 'CEN' });
  });

  it('acota los pesos a 0-100 e ignora valores no numéricos y pesos todos en cero', () => {
    expect(leerEnlace('a=500&b=-5&g=abc', IDS).controles).toEqual({ corta: 100, rapido: 0, tranquilo: 0 });
    expect(leerEnlace('a=0&b=0&g=0', IDS).controles).toBeUndefined();
  });

  it('lee la vista y el tiempo máximo, e ignora vistas inválidas', () => {
    expect(leerEnlace('v=alcance&t=45', IDS)).toEqual({ vista: 'alcance', tMax: 45 });
    expect(leerEnlace('v=hackeo', IDS)).toEqual({});
  });

  it('crearEnlace y leerEnlace son inversos', () => {
    const e = { origen: 'SAN', destino: 'CAR', controles: { corta: 70, rapido: 20, tranquilo: 10 }, vista: 'caminos' as const, tMax: 30 };
    expect(leerEnlace(crearEnlace(e).split('?')[1], IDS)).toEqual(e);
  });

  it('sin parámetros el enlace es /mapa', () => {
    expect(crearEnlace({})).toBe('/mapa');
  });
});

describe('Controles simples → pesos α, β, γ', () => {
  it('"Ruta corta" = α, "Llegar rápido" = β, "Camino tranquilo" = γ', () => {
    expect(controlesAPesosCrudos({ corta: 1, rapido: 2, tranquilo: 3 })).toEqual({ alfa: 1, beta: 2, gamma: 3 });
  });

  it('los pesos normalizados suman 1', () => {
    const p = controlesAPesos({ corta: 50, rapido: 30, tranquilo: 20 });
    expect(p).toEqual({ alfa: 0.5, beta: 0.3, gamma: 0.2 });
  });

  it('todos en cero es inválido (null)', () => {
    expect(controlesAPesos({ corta: 0, rapido: 0, tranquilo: 0 })).toBeNull();
  });

  it('pesosAControles devuelve porcentajes', () => {
    expect(pesosAControles({ alfa: 1, beta: 1, gamma: 2 })).toEqual({ corta: 25, rapido: 25, tranquilo: 50 });
    expect(controlesAPesos(CONTROLES_EQUILIBRADOS)).not.toBeNull();
  });
});
