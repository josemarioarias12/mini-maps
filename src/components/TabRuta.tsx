import type { Grafo, Pesos } from '../lib/tipos';
import type { Rutas, RutaCalculada } from '../lib/modelo';
import { Aviso, SelectorLugar, Seccion, clBoton } from './ui';

interface Props {
  grafo: Grafo;
  origen: string | null;
  destino: string | null;
  setOrigen: (id: string | null) => void;
  setDestino: (id: string | null) => void;
  pesosUI: Pesos;
  setPesosUI: (p: Pesos) => void;
  pesos: Pesos | null; // normalizados (null si son inválidos)
  rutas: Rutas | null;
}

const PRESETS: { nombre: string; p: Pesos }[] = [
  { nombre: 'Más corta', p: { alfa: 100, beta: 0, gamma: 0 } },
  { nombre: 'Más rápida', p: { alfa: 0, beta: 100, gamma: 0 } },
  { nombre: 'Menor esfuerzo', p: { alfa: 0, beta: 0, gamma: 100 } },
  { nombre: 'Prefiero distancia', p: { alfa: 70, beta: 20, gamma: 10 } },
  { nombre: 'Equilibrada', p: { alfa: 34, beta: 33, gamma: 33 } },
];

export function TabRuta({ grafo, origen, destino, setOrigen, setDestino, pesosUI, setPesosUI, pesos, rutas }: Props) {
  const nombres = (r: RutaCalculada) => (r.ruta ? r.ruta.map((i) => grafo.lugares[i].nombre).join(' → ') : '—');
  const pct = (v: number | undefined) => (v === undefined ? '—' : `${Math.round(v * 100)} %`);

  let mensaje: string | null = null;
  if (!origen || !destino) mensaje = 'Elija un origen y un destino (también puede hacer clic sobre los lugares del mapa).';
  else if (origen === destino) mensaje = 'El origen y el destino son el mismo lugar: elija un destino distinto.';
  else if (rutas && !rutas.personalizada.ruta) mensaje = 'No existe ruta entre estos dos lugares: están en zonas desconectadas del mapa.';

  const filas: { titulo: string; r: RutaCalculada }[] = rutas
    ? [
        { titulo: 'Personalizada (C)', r: rutas.personalizada },
        { titulo: 'Más corta (solo D)', r: rutas.distancia },
        { titulo: 'Más rápida (solo T)', r: rutas.tiempo },
        { titulo: 'Menor esfuerzo (solo E)', r: rutas.esfuerzo },
      ]
    : [];

  const sliders: { clave: keyof Pesos; nombre: string }[] = [
    { clave: 'alfa', nombre: 'α · Distancia' },
    { clave: 'beta', nombre: 'β · Tiempo' },
    { clave: 'gamma', nombre: 'γ · Esfuerzo' },
  ];
  const pasos = rutas?.personalizada.pasos ?? [];

  return (
    <div>
      <Seccion titulo="Origen y destino">
        <div className="grid grid-cols-2 gap-3">
          <SelectorLugar etiqueta="Origen" valor={origen} lugares={grafo.lugares} onChange={setOrigen} />
          <SelectorLugar etiqueta="Destino" valor={destino} lugares={grafo.lugares} onChange={setDestino} />
        </div>
        <button className={`${clBoton} mt-2`} onClick={() => { setOrigen(destino); setDestino(origen); }}>
          ⇄ Intercambiar
        </button>
      </Seccion>

      <Seccion titulo="Personalización: C = α·D′ + β·T′ + γ·E′">
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((x) => (
            <button key={x.nombre} className={clBoton} onClick={() => setPesosUI(x.p)}>
              {x.nombre}
            </button>
          ))}
        </div>
        {sliders.map((s) => (
          <label key={s.clave} className="mb-2 block text-sm">
            <span className="flex justify-between">
              <span className="font-medium">{s.nombre}</span>
              <span className="font-mono text-xs text-slate-500">
                {Math.round(pesosUI[s.clave])} → {pct(pesos?.[s.clave])}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={pesosUI[s.clave]}
              onChange={(e) => setPesosUI({ ...pesosUI, [s.clave]: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
          </label>
        ))}
        {!pesos ? (
          <Aviso tipo="error">Pesos inválidos: al menos uno debe ser mayor que 0 (α + β + γ debe sumar 1 después de normalizar).</Aviso>
        ) : (
          <p className="text-xs text-slate-500">Los sliders se normalizan automáticamente para que α + β + γ = 1.</p>
        )}
        <details className="mt-2 rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-800">
          <summary className="cursor-pointer font-medium">¿Por qué se normalizan D, T y E?</summary>
          <p className="mt-1">
            La distancia está en km, el tiempo en minutos y el esfuerzo en una escala 1–10. Sumarlas tal cual haría que la magnitud con números
            más grandes dominara. Por eso cada matriz se divide entre su valor máximo (D′ = D / máx D), quedando en el rango (0, 1]. Es un cambio
            de escala puro: si solo se usa un criterio, la ruta óptima es exactamente la misma que con los valores originales.
          </p>
        </details>
      </Seccion>

      {mensaje && <Aviso tipo={origen && destino && origen !== destino && rutas ? 'error' : 'info'}>{mensaje}</Aviso>}

      {rutas && rutas.personalizada.ruta && (
        <>
          <Seccion titulo="Ruta personalizada">
            <p className="mb-1 text-sm font-medium">{nombres(rutas.personalizada)}</p>
            <p className="text-xs text-slate-500">Costo total C = {rutas.personalizada.costo.toFixed(3)}</p>
          </Seccion>

          <Seccion titulo="Comparador de rutas">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-left dark:bg-slate-800">
                    <th className="p-1.5">Criterio</th>
                    <th className="p-1.5">Km</th>
                    <th className="p-1.5">Min</th>
                    <th className="p-1.5">Esf.</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map(({ titulo, r }) => (
                    <tr key={titulo} className="border-t border-slate-200 align-top dark:border-slate-800">
                      <td className="p-1.5">
                        <div className="font-semibold">{titulo}</div>
                        <div className="text-slate-500">{nombres(r)}</div>
                      </td>
                      <td className="p-1.5 font-mono">{r.totales ? r.totales.d.toFixed(1) : '—'}</td>
                      <td className="p-1.5 font-mono">{r.totales ? r.totales.t.toFixed(0) : '—'}</td>
                      <td className="p-1.5 font-mono">{r.totales ? r.totales.e.toFixed(0) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>

          <Seccion titulo="Pasos de Dijkstra sobre C">
            <details className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-800">
              <summary className="cursor-pointer font-medium">Ver tabla de iteraciones ({pasos.length})</summary>
              <div className="mt-2 overflow-x-auto">
                <table className="border-collapse font-mono text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="px-1 py-1">it.</th>
                      <th className="px-1 py-1">visitado</th>
                      {grafo.lugares.map((l) => (
                        <th key={l.id} className="px-1 py-1">{l.id}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pasos.map((p) => (
                      <tr key={p.iteracion} className="border-t border-slate-200 dark:border-slate-800">
                        <td className="px-1 py-1 text-center">{p.iteracion}</td>
                        <td className="px-1 py-1 text-center font-bold">{grafo.lugares[p.visitado].id}</td>
                        {p.dist.map((d, j) => (
                          <td key={grafo.lugares[j].id} className={`px-1 py-1 text-center ${p.actualizados.includes(j) ? 'bg-amber-200 font-bold text-slate-900' : ''}`}>
                            {Number.isFinite(d) ? d.toFixed(2) : '∞'}
                            <div className="text-slate-400">{p.pred[j] === null ? '' : `←${grafo.lugares[p.pred[j] as number].id}`}</div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-1 text-slate-500">Cada celda: distancia tentativa y predecesor. En amarillo, lo que mejoró en esa iteración.</p>
            </details>
          </Seccion>
        </>
      )}
    </div>
  );
}
