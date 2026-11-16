import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Calculos } from '../../hooks/useCalculos';
import { componentes, esConexo, lugaresAislados, recorridos } from '../../lib/accesibilidad';
import { potencia } from '../../lib/matrices';
import { reproyectar } from '../../data/real';
import { META_DATOS, DATOS_REALES } from '../../data/datasetActivo';
import { useApp } from '../../store/useApp';
import { TabEditor } from '../TabEditor';
import { TabMatrices } from '../TabMatrices';
import { TablaMatriz } from '../TablaMatriz';
import { Aviso, Seccion } from '../ui/basicos';
import { Boton } from '../ui/Boton';
import { BuscadorLugar } from './BuscadorLugar';
import { EncabezadoVista } from './EncabezadoVista';

/* ---------- ¿Hasta dónde llego? (isócronas) ---------- */
export function VistaAlcance({ calc }: { calc: Calculos }) {
  const s = useApp();
  const { alcanzables } = calc;
  return (
    <EncabezadoVista titulo="¿Hasta dónde llego?" subtitulo="Elija un punto de partida y un tiempo: el mapa sombrea todos los lugares a los que se llega en ese tiempo o menos.">
      <BuscadorLugar etiqueta="Punto de partida" valor={s.origen} lugares={s.grafo.lugares} onChange={s.setOrigen} color="verde" />
      <label className="mt-4 block text-sm">
        <span className="flex justify-between">
          <span className="font-medium">Tiempo disponible</span>
          <span className="font-mono text-xs">{s.tMax} min</span>
        </span>
        <input type="range" min={0} max={90} value={s.tMax} onChange={(e) => s.setTMax(Number(e.target.value))} className="w-full accent-amber-500" aria-label="Tiempo disponible en minutos" />
      </label>
      {!s.origen || calc.oi < 0 ? (
        <Aviso tipo="info">Elija un punto de partida para ver la zona de alcance.</Aviso>
      ) : (
        <Seccion titulo={`Con ${s.tMax} min llega a ${alcanzables.length} de ${s.grafo.lugares.length} lugares`}>
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-sm dark:divide-slate-800 dark:border-slate-800">
            {alcanzables.map((a) => (
              <li key={a.indice} className="flex justify-between px-3 py-2">
                <span>{s.grafo.lugares[a.indice].nombre.split(' – ')[0]}</span>
                <span className="font-mono text-xs">{a.tiempo === 0 ? 'aquí' : `${a.tiempo.toFixed(0)} min`}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">Tiempos sin tráfico. La zona sombreada es una aproximación visual de los lugares alcanzables.</p>
        </Seccion>
      )}
    </EncabezadoVista>
  );
}

/* ---------- ¿De cuántas formas llego? (potencias y accesibilidad) ---------- */
export function VistaCaminos({ calc }: { calc: Calculos }) {
  const s = useApp();
  const { modelo, R, oi, di } = calc;
  const et = s.grafo.lugares.map((l) => l.id);
  const Mk = useMemo(() => potencia(modelo.M, s.k), [modelo.M, s.k]);
  const par = oi >= 0 && di >= 0;
  const lista = par && s.k <= 3 ? recorridos(modelo.M, oi, di, s.k) : [];
  const conexo = esConexo(R);
  const aislados = lugaresAislados(modelo.M);
  const nombre = (i: number) => s.grafo.lugares[i].nombre.split(' – ')[0];
  return (
    <EncabezadoVista titulo="¿De cuántas formas llego?" subtitulo="Cuenta los recorridos que tienen exactamente el número de tramos que usted elija (un tramo = pasar de un lugar a otro vecino).">
      <div className="space-y-2">
        <BuscadorLugar etiqueta="Desde" valor={s.origen} lugares={s.grafo.lugares} onChange={s.setOrigen} color="verde" />
        <BuscadorLugar etiqueta="Hasta" valor={s.destino} lugares={s.grafo.lugares} onChange={s.setDestino} color="rojo" />
      </div>
      <label className="mt-4 block text-sm">
        <span className="flex justify-between">
          <span className="font-medium">Número de tramos</span>
          <span className="font-mono text-xs">{s.k}</span>
        </span>
        <input type="range" min={1} max={6} value={s.k} onChange={(e) => s.setK(Number(e.target.value))} className="w-full accent-blue-600" aria-label="Número de tramos" />
      </label>
      {par ? (
        <Aviso tipo="info">
          Hay <strong>{Mk[oi][di]}</strong> {Mk[oi][di] === 1 ? 'forma' : 'formas'} de ir de {nombre(oi)} a {nombre(di)} en exactamente {s.k} {s.k === 1 ? 'tramo' : 'tramos'}.
        </Aviso>
      ) : (
        <Aviso tipo="info">Elija «Desde» y «Hasta» para contar los recorridos.</Aviso>
      )}
      {lista.length > 0 && (
        <ul className="mb-3 max-h-44 overflow-y-auto rounded-xl border border-slate-200 p-2 text-xs dark:border-slate-800">
          {lista.map((c) => (
            <li key={c.join('-')} className="py-0.5">{c.map(nombre).join(' → ')}</li>
          ))}
        </ul>
      )}
      {par && s.k > 3 && <p className="mb-3 text-xs text-slate-500">Los recorridos solo se listan hasta 3 tramos.</p>}

      <Seccion titulo="¿Se puede llegar de cualquier lugar a cualquier otro?">
        {conexo ? (
          <Aviso tipo="ok">Sí: el mapa está completamente conectado.</Aviso>
        ) : (
          <Aviso tipo="error">
            No: hay {componentes(R).length} zonas separadas.
            {aislados.length > 0 && <> Lugares aislados: {aislados.map(nombre).join(', ')}.</>}
          </Aviso>
        )}
      </Seccion>
      <details className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
        <summary className="cursor-pointer font-medium">Ver el detalle matemático</summary>
        <p className="mb-2 mt-2 text-xs text-slate-600 dark:text-slate-300">
          La entrada (i, j) de M<sup>k</sup> cuenta los recorridos de exactamente k tramos entre i y j. La accesibilidad es R = I + M + M² + … + Mⁿ⁻¹: el grafo es conexo si todas sus entradas son positivas.
        </p>
        <TablaMatriz titulo={`M^${s.k}`} etiquetas={et} datos={Mk} resaltar={par ? [oi, di] : null} />
        <TablaMatriz titulo="R (accesibilidad)" etiquetas={et} datos={R} />
      </details>
    </EncabezadoVista>
  );
}

/* ---------- Modo avanzado: fórmula, Dijkstra y matrices ---------- */
export function VistaAvanzada({ calc }: { calc: Calculos }) {
  const s = useApp();
  const pasos = calc.rutas?.[s.alternativa === 'personalizada' ? 'personalizada' : s.alternativa]?.pasos ?? [];
  const lugares = s.grafo.lugares;
  return (
    <EncabezadoVista titulo="Modo avanzado: el álgebra detrás de la ruta" subtitulo="Estas son las matrices y los pasos del algoritmo con los valores reales del mapa.">
      <Seccion titulo="Pasos de Dijkstra sobre la matriz de costos C">
        {pasos.length === 0 ? (
          <Aviso tipo="info">Elija origen y destino para ver los pasos.</Aviso>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="border-collapse font-mono text-[10px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="px-1.5 py-1">it.</th>
                  <th className="px-1.5 py-1">visita</th>
                  {lugares.map((l) => <th key={l.id} className="px-1.5 py-1">{l.id}</th>)}
                </tr>
              </thead>
              <tbody>
                {pasos.map((p) => (
                  <tr key={p.iteracion} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-1.5 py-1 text-center">{p.iteracion}</td>
                    <td className="px-1.5 py-1 text-center font-bold">{lugares[p.visitado].id}</td>
                    {p.dist.map((d, j) => (
                      <td key={lugares[j].id} className={`px-1.5 py-1 text-center ${p.actualizados.includes(j) ? 'bg-amber-200 font-bold text-slate-900' : ''}`}>
                        {Number.isFinite(d) ? d.toFixed(2) : '∞'}
                        <div className="text-slate-400">{p.pred[j] === null ? '' : `←${lugares[p.pred[j] as number].id}`}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-1 text-xs text-slate-500">Cada celda: costo acumulado y predecesor. En amarillo, lo que mejoró en esa iteración.</p>
      </Seccion>
      <TabMatrices grafo={s.grafo} modelo={calc.modelo} pesos={calc.pesos} />
    </EncabezadoVista>
  );
}

/* ---------- Editor del grafo ---------- */
export function VistaEditor() {
  const s = useApp();
  return (
    <EncabezadoVista titulo="Editar el mapa" subtitulo="Agregue o quite lugares y calles, o cambie sus distancias, tiempos y esfuerzo. Todo se puede deshacer.">
      <div className="mb-3 flex gap-2">
        <Boton tamano="sm" disabled={s.historial.length === 0} onClick={s.deshacer}>↶ Deshacer</Boton>
        <Boton tamano="sm" onClick={() => { s.restablecer(); s.mostrarToast('Se restablecieron los datos de ejemplo'); }}>↺ Restablecer todo</Boton>
      </div>
      <TabEditor
        grafo={s.grafo}
        setGrafo={(g) => {
          const eliminado = g.lugares.length < s.grafo.lugares.length || g.calles.length < s.grafo.calles.length;
          s.editarGrafo(reproyectar(g));
          if (eliminado) s.mostrarToast('Elemento eliminado', { texto: 'Deshacer', fn: s.deshacer });
        }}
        onRestablecer={() => { s.restablecer(); s.mostrarToast('Se restablecieron los datos de ejemplo'); }}
      />
    </EncabezadoVista>
  );
}

/* ---------- Sobre los datos ---------- */
export function VistaDatos() {
  const s = useApp();
  return (
    <EncabezadoVista titulo="Sobre los datos" subtitulo="Qué es real y qué es una estimación en este mapa.">
      {DATOS_REALES ? (
        <Aviso tipo="ok">Se usan calles reales de OpenStreetMap{META_DATOS ? ` (generado el ${META_DATOS.generado.slice(0, 10)})` : ''}.</Aviso>
      ) : (
        <Aviso tipo="info">Se usan datos <strong>ilustrativos</strong>. Con <code>npm run datos</code> se generan los reales.</Aviso>
      )}
      <ul className="mb-4 list-disc space-y-1.5 pl-5 text-sm">
        <li><strong>Distancia y trazado:</strong> reales (OpenStreetMap, OSRM).</li>
        <li><strong>Tiempo:</strong> sin tráfico en tiempo real.</li>
        <li><strong>Esfuerzo:</strong> estimación propia a partir de pendiente (Open-Meteo), curvas y congestión asignada a mano.</li>
        <li><strong>Cálculo de rutas:</strong> lo hace este programa con matrices y el algoritmo de Dijkstra; ninguna API calcula la ruta.</li>
      </ul>
      <Seccion titulo={`Lugares (${s.grafo.lugares.length})`}>
        <ul className="grid grid-cols-1 gap-1 text-sm">
          {s.grafo.lugares.map((l) => (
            <li key={l.id} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800">
              <span>{l.nombre.split(' – ')[0]}</span>
              <span className="flex gap-1">
                <button className="rounded-md bg-green-600 px-2 py-0.5 text-xs font-semibold text-white" onClick={() => { s.setOrigen(l.id); s.setVista('ruta'); }}>Origen</button>
                <button className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white" onClick={() => { s.setDestino(l.id); s.setVista('ruta'); }}>Destino</button>
              </span>
            </li>
          ))}
        </ul>
      </Seccion>
      <p className="text-xs text-slate-500">© OpenStreetMap contributors · © CARTO · Open-Meteo. <Link to="/guia" className="underline">Ver la guía de uso</Link></p>
    </EncabezadoVista>
  );
}
