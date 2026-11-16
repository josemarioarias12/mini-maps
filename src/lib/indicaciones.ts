import type { Grafo } from './tipos';

export interface Indicacion {
  texto: string;
  detalle?: string;
}

/** Indicaciones paso a paso de una ruta (índices de lugares), al estilo de una app de mapas. */
export function indicaciones(g: Grafo, ruta: number[]): Indicacion[] {
  if (ruta.length < 2) return [];
  const nombre = (i: number): string => g.lugares[ruta[i]].nombre.split(' – ')[0];
  const pasos: Indicacion[] = [{ texto: `Salga de ${nombre(0)}` }];
  for (let i = 0; i < ruta.length - 1; i++) {
    const a = g.lugares[ruta[i]].id;
    const b = g.lugares[ruta[i + 1]].id;
    const c = g.calles.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
    const partes = c ? [`${c.d} km`, `${c.t} min`, ...(c.corredor ? [`por ${c.corredor}`] : [])] : [];
    pasos.push({ texto: `Continúe hacia ${nombre(i + 1)}`, detalle: partes.join(' · ') || undefined });
  }
  pasos.push({ texto: `Llegó a ${nombre(ruta.length - 1)}` });
  return pasos;
}
