import type { Grafo } from '../lib/tipos';
import type { Alcanzable } from '../lib/isocronas';
import { Aviso, SelectorLugar, Seccion } from './ui';

interface Props {
  grafo: Grafo;
  origen: string | null;
  setOrigen: (id: string | null) => void;
  tMax: number;
  setTMax: (n: number) => void;
  resultado: Alcanzable[];
}

export function TabIsocronas({ grafo, origen, setOrigen, tMax, setTMax, resultado }: Props) {
  const fuera = grafo.lugares.length - resultado.length;
  return (
    <div>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
        Una <strong>isócrona</strong> es la zona alcanzable desde un origen en un tiempo máximo. Se calcula con Dijkstra sobre la matriz de
        tiempos T y se conservan los lugares con tiempo mínimo ≤ t<sub>máx</sub>.
      </p>
      <Seccion titulo="Parámetros">
        <SelectorLugar etiqueta="Origen" valor={origen} lugares={grafo.lugares} onChange={setOrigen} />
        <label className="mt-3 block text-sm">
          <span className="flex justify-between">
            <span className="font-medium">Tiempo máximo</span>
            <span className="font-mono text-xs">{tMax} min</span>
          </span>
          <input type="range" min={0} max={120} value={tMax} onChange={(e) => setTMax(Number(e.target.value))} className="w-full accent-amber-500" />
        </label>
      </Seccion>
      {!origen ? (
        <Aviso tipo="info">Elija un origen (o haga clic en un lugar del mapa).</Aviso>
      ) : (
        <Seccion titulo={`Alcanzables: ${resultado.length} de ${grafo.lugares.length}`}>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 text-sm dark:divide-slate-800 dark:border-slate-800">
            {resultado.map((a) => (
              <li key={a.indice} className="flex justify-between px-3 py-1.5">
                <span>{grafo.lugares[a.indice].nombre}</span>
                <span className="font-mono text-xs">{a.tiempo.toFixed(0)} min</span>
              </li>
            ))}
          </ul>
          {fuera > 0 && <p className="mt-2 text-xs text-slate-500">{fuera} lugar(es) quedan fuera de esta isócrona.</p>}
        </Seccion>
      )}
    </div>
  );
}
