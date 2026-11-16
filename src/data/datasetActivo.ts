import { GRAFO_EJEMPLO } from './ejemplo';
import { grafoDesdeReal } from './real';
import type { DatosReales } from './real';

// Si existe src/data/real.json (npm run datos) se usa; si no, el dataset ilustrativo.
const modulos = import.meta.glob<DatosReales>('./real.json', { eager: true, import: 'default' });
const real: DatosReales | undefined = Object.values(modulos)[0];

export const DATASET = real ? grafoDesdeReal(real) : GRAFO_EJEMPLO;
export const DATOS_REALES = real !== undefined;
export const META_DATOS = real?.meta ?? null;
export const ORIGEN_DEFECTO = 'SAN';
export const DESTINO_DEFECTO = 'CAR';
