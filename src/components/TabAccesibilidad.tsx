import { useMemo } from 'react';
import type { Grafo } from '../lib/tipos';
import type { Modelo } from '../lib/modelo';
import { potencia } from '../lib/matrices';
import { accesibilidad, componentes, esConexo, lugaresAislados, recorridos } from '../lib/accesibilidad';
import { TablaMatriz } from './TablaMatriz';
import { Aviso, SelectorLugar, Seccion } from './ui';

interface Props {
  grafo: Grafo;
  modelo: Modelo;
  origen: string | null;
  destino: string | null;
  setOrigen: (id: string | null) => void;
  setDestino: (id: string | null) => void;
  k: number;
  setK: (n: number) => void;
}

export function TabAccesibilidad({ grafo, modelo, origen, destino, setOrigen, setDestino, k, setK }: Props) {
  const et = grafo.lugares.map((l) => l.id);
  const Mk = useMemo(() => potencia(modelo.M, k), [modelo.M, k]);
  const R = useMemo(() => accesibilidad(modelo.M), [modelo.M]);
  const conexo = esConexo(R);
  const aislados = lugaresAislados(modelo.M);
  const grupos = componentes(R);

  const oi = grafo.lugares.findIndex((l) => l.id === origen);
  const di = grafo.lugares.findIndex((l) => l.id === destino);
  const par = oi >= 0 && di >= 0;
  const lista = par && k <= 3 ? recorridos(modelo.M, oi, di, k) : [];

  return (
    <div>
      <Seccion titulo="Potencias de la matriz de adyacencia">
        <div className="grid grid-cols-2 gap-3">
          <SelectorLugar etiqueta="Origen" valor={origen} lugares={grafo.lugares} onChange={setOrigen} />
          <SelectorLugar etiqueta="Destino" valor={destino} lugares={grafo.lugares} onChange={setDestino} />
        </div>
        <label className="mt-3 block text-sm">
          <span className="flex justify-between">
            <span className="font-medium">Número de tramos k</span>
            <span className="font-mono text-xs">k = {k}</span>
          </span>
          <input type="range" min={1} max={6} value={k} onChange={(e) => setK(Number(e.target.value))} className="w-full accent-blue-600" />
        </label>
        {par ? (
          <Aviso tipo="info">
            Hay <strong>{Mk[oi][di]}</strong> recorrido(s) de exactamente {k} tramo(s) entre {grafo.lugares[oi].nombre} y {grafo.lugares[di].nombre}{' '}
            (entrada M<sup>{k}</sup>[{et[oi]}, {et[di]}]).
          </Aviso>
        ) : (
          <Aviso tipo="info">Elija origen y destino para contar recorridos.</Aviso>
        )}
        {par && k <= 3 && lista.length > 0 && (
          <ul className="mb-3 max-h-40 overflow-y-auto rounded-lg border border-slate-200 p-2 font-mono text-xs dark:border-slate-800">
            {lista.map((c) => (
              <li key={c.join('-')}>{c.map((i) => et[i]).join(' → ')}</li>
            ))}
          </ul>
        )}
        {par && k > 3 && <p className="mb-3 text-xs text-slate-500">Los recorridos solo se listan para k ≤ 3.</p>}
        <TablaMatriz titulo={`M^${k}`} etiquetas={et} datos={Mk} resaltar={par ? [oi, di] : null} />
      </Seccion>

      <Seccion titulo="Matriz de accesibilidad R = I + M + M² + … + Mⁿ⁻¹">
        {conexo ? (
          <Aviso tipo="ok">El grafo es <strong>conexo</strong>: todos los r<sub>ij</sub> son mayores que 0, así que cualquier lugar puede alcanzar a cualquier otro.</Aviso>
        ) : (
          <Aviso tipo="error">
            El grafo <strong>no es conexo</strong>: hay {grupos.length} zonas separadas.
            {aislados.length > 0 && <> Lugares aislados: {aislados.map((i) => grafo.lugares[i].nombre).join(', ')}.</>}
          </Aviso>
        )}
        <TablaMatriz etiquetas={et} datos={R} />
      </Seccion>
    </div>
  );
}
