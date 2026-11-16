import type { Controles } from './controles';

/** Vistas del panel del mapa. */
export type Vista = 'ruta' | 'avanzado' | 'alcance' | 'caminos' | 'editor' | 'datos';
export const VISTAS: Vista[] = ['ruta', 'avanzado', 'alcance', 'caminos', 'editor', 'datos'];

/**
 * Estado que se puede compartir por enlace: /mapa?o=CEN&d=CAR&a=40&b=40&g=20&v=alcance&t=30
 *  o = origen · d = destino · a = peso de la distancia (α, "ruta corta") ·
 *  b = peso del tiempo (β, "llegar rápido") · g = peso del esfuerzo (γ, "camino tranquilo") ·
 *  v = vista · t = tiempo máximo de la isócrona (min)
 */
export interface Enlace {
  origen?: string;
  destino?: string;
  controles?: Controles;
  vista?: Vista;
  tMax?: number;
}

const acotar = (x: number, min: number, max: number): number => Math.min(max, Math.max(min, x));

function numero(v: string | null, min: number, max: number): number | undefined {
  if (v === null || v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? acotar(n, min, max) : undefined;
}

/** Lee y valida los parámetros de la URL; lo inválido se ignora. */
export function leerEnlace(params: URLSearchParams | string, idsValidos: string[]): Enlace {
  const q = typeof params === 'string' ? new URLSearchParams(params) : params;
  const r: Enlace = {};
  const id = (v: string | null): string | undefined => {
    const x = v?.toUpperCase();
    return x && idsValidos.includes(x) ? x : undefined;
  };
  const o = id(q.get('o'));
  const d = id(q.get('d'));
  if (o) r.origen = o;
  if (d) r.destino = d;

  const a = numero(q.get('a'), 0, 100);
  const b = numero(q.get('b'), 0, 100);
  const g = numero(q.get('g'), 0, 100);
  if ((a ?? 0) + (b ?? 0) + (g ?? 0) > 0) r.controles = { corta: a ?? 0, rapido: b ?? 0, tranquilo: g ?? 0 };

  const v = q.get('v');
  if (v && (VISTAS as string[]).includes(v)) r.vista = v as Vista;
  const t = numero(q.get('t'), 0, 180);
  if (t !== undefined) r.tMax = Math.round(t);
  return r;
}

/** Construye la ruta (sin dominio) /mapa?... para un estado dado. */
export function crearEnlace(e: Enlace): string {
  const q = new URLSearchParams();
  if (e.origen) q.set('o', e.origen);
  if (e.destino) q.set('d', e.destino);
  if (e.controles) {
    q.set('a', String(Math.round(e.controles.corta)));
    q.set('b', String(Math.round(e.controles.rapido)));
    q.set('g', String(Math.round(e.controles.tranquilo)));
  }
  if (e.vista && e.vista !== 'ruta') q.set('v', e.vista);
  if (e.tMax !== undefined) q.set('t', String(Math.round(e.tMax)));
  const s = q.toString();
  return s ? `/mapa?${s}` : '/mapa';
}
