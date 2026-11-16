import { useMemo } from 'react';
import { useApp } from '../store/useApp';
import { controlesAPesos } from '../lib/controles';
import { indiceDe } from '../lib/matrices';
import { calcularRutas, construirModelo } from '../lib/modelo';
import type { Modelo, Rutas } from '../lib/modelo';
import { isocrona } from '../lib/isocronas';
import type { Alcanzable } from '../lib/isocronas';
import { accesibilidad } from '../lib/accesibilidad';
import type { Matriz, Pesos } from '../lib/tipos';

export type EstadoRuta = 'sin-seleccion' | 'mismo-lugar' | 'pesos-invalidos' | 'sin-ruta' | 'ok';

export interface Calculos {
  pesos: Pesos | null;
  modelo: Modelo;
  R: Matriz;
  oi: number;
  di: number;
  rutas: Rutas | null;
  estado: EstadoRuta;
  alcanzables: Alcanzable[];
}

const IGUALES: Pesos = { alfa: 1 / 3, beta: 1 / 3, gamma: 1 / 3 };

/** Todo el cálculo derivado (matrices, rutas, isócronas) a partir del estado global. Memoizado. */
export function useCalculos(): Calculos {
  const grafo = useApp((s) => s.grafo);
  const origen = useApp((s) => s.origen);
  const destino = useApp((s) => s.destino);
  const controles = useApp((s) => s.controles);
  const tMax = useApp((s) => s.tMax);

  const pesos = useMemo(() => controlesAPesos(controles), [controles]);
  const modelo = useMemo(() => construirModelo(grafo, pesos ?? IGUALES), [grafo, pesos]);
  const R = useMemo(() => accesibilidad(modelo.M), [modelo.M]);
  const oi = useMemo(() => (origen ? indiceDe(grafo, origen) : -1), [grafo, origen]);
  const di = useMemo(() => (destino ? indiceDe(grafo, destino) : -1), [grafo, destino]);

  const rutas = useMemo(
    () => (pesos && oi >= 0 && di >= 0 && oi !== di ? calcularRutas(grafo, modelo, oi, di) : null),
    [grafo, modelo, pesos, oi, di],
  );
  const alcanzables = useMemo(() => (oi >= 0 ? isocrona(modelo.T, oi, tMax) : []), [modelo.T, oi, tMax]);

  let estado: EstadoRuta = 'ok';
  if (!pesos) estado = 'pesos-invalidos';
  else if (oi < 0 || di < 0) estado = 'sin-seleccion';
  else if (oi === di) estado = 'mismo-lugar';
  else if (!rutas?.personalizada.ruta) estado = 'sin-ruta';

  return { pesos, modelo, R, oi, di, rutas, estado, alcanzables };
}
