export type Punto = [number, number];
export const R_TIERRA_M: number;
export function acotar(x: number, min: number, max: number): number;
export function haversineM(a: Punto, b: Punto): number;
export function longitudM(coords: Punto[]): number;
export function remuestrear(coords: Punto[], pasoM?: number): Punto[];
export function simplificar(coords: Punto[], max?: number): Punto[];
export function perfilAltimetrico(alturas: number[]): { ascenso: number; descenso: number };
export function calcularEsfuerzo(p: {
  ascenso: number;
  descenso: number;
  distanciaM: number;
  lineaRectaM: number;
  congestion: number;
}): { valor: number; g: number; sinuosidad: number; ep: number; es: number; ec: number };
export function esConexoLista(ids: string[], calles: { a: string; b: string }[]): boolean;
export function validar(datos: {
  lugares: { id: string; lat: number; lng: number }[];
  calles: { a: string; b: string; d: number; t: number; e: number }[];
}): string[];
