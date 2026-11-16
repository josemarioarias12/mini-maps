import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GRAFO_DEMO } from '../../data/demo';
import { accesibilidad, esConexo, recorridos } from '../../lib/accesibilidad';
import { controlesAPesos } from '../../lib/controles';
import { dijkstra, rutaMinima } from '../../lib/dijkstra';
import { isocrona } from '../../lib/isocronas';
import { matrizAdyacencia, potencia } from '../../lib/matrices';
import { calcularRutas, construirModelo } from '../../lib/modelo';
import type { Grafo } from '../../lib/tipos';
import { TablaMatriz } from '../TablaMatriz';
import { Boton } from '../ui/Boton';
import { GrafoSVG } from './GrafoSVG';

const ET = GRAFO_DEMO.lugares.map((l) => l.id);
const MODELO_BASE = construirModelo(GRAFO_DEMO, { alfa: 1 / 3, beta: 1 / 3, gamma: 1 / 3 });

export function TarjetaConcepto({ id, titulo, formula, texto, enlace, children }: { id: string; titulo: string; formula?: string; texto: string; enlace: string; children: ReactNode }) {
  return (
    <article id={id} className="scroll-mt-24 rounded-tarjeta border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-xl font-bold">{titulo}</h3>
      {formula && <p className="mt-1 inline-block rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-sm dark:bg-slate-800">{formula}</p>}
      <p className="mb-4 mt-2 text-sm text-slate-600 dark:text-slate-300">{texto}</p>
      {children}
      <Link to={enlace} className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline dark:text-sky-400">Verlo en el mapa →</Link>
    </article>
  );
}

/* a) Grafo ↔ matriz de adyacencia */
export function WidgetAdyacencia() {
  const [hover, setHover] = useState<string | null>(null);
  const M = useMemo(() => matrizAdyacencia(GRAFO_DEMO), []);
  const h = hover ? ET.indexOf(hover) : -1;
  return (
    <div className="grid items-center gap-5 sm:grid-cols-2">
      <GrafoSVG grafo={GRAFO_DEMO} nodoEnfasis={hover} onHoverNodo={setHover} aria="Grafo de ejemplo con seis lugares" />
      <div className="inclinar">
        <table className="mx-auto border-collapse font-mono text-sm" aria-label="Matriz de adyacencia del grafo de ejemplo">
          <thead><tr><th />{ET.map((e) => <th key={e} className={`px-2 py-1 ${hover === e ? 'text-blue-600' : 'text-slate-500'}`}>{e}</th>)}</tr></thead>
          <tbody>
            {M.map((fila, i) => (
              <tr key={ET[i]}>
                <th className={`px-2 py-1 ${h === i ? 'text-blue-600' : 'text-slate-500'}`}>{ET[i]}</th>
                {fila.map((v, j) => (
                  <td key={ET[j]} className={`h-9 w-9 rounded text-center transition-colors ${h === i || h === j ? 'bg-blue-100 dark:bg-blue-950' : ''} ${v ? 'font-bold text-blue-700 dark:text-sky-300' : 'text-slate-400'}`}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-center text-xs text-slate-500">Pase el cursor sobre un lugar: se ilumina su fila y su columna.</p>
      </div>
    </div>
  );
}

/* b) Potencias M^k */
export function WidgetPotencias() {
  const [k, setK] = useState(3);
  const [i, setI] = useState(0);
  const M = MODELO_BASE.M;
  const Mk = useMemo(() => potencia(M, k), [M, k]);
  const lista = useMemo(() => recorridos(M, 0, 5, k), [M, k]);
  useEffect(() => {
    setI(0);
    if (lista.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % lista.length), 1400);
    return () => clearInterval(t);
  }, [lista]);
  const actual = lista[i]?.map((x) => ET[x]) ?? null;
  return (
    <div className="grid items-center gap-5 sm:grid-cols-2">
      <GrafoSVG grafo={GRAFO_DEMO} ruta={actual} aria={`Recorrido de ${k} tramos de A a F`} colorRuta="#7c3aed" />
      <div>
        <label className="block text-sm font-medium">Tramos: <span className="font-mono">{k}</span>
          <input type="range" min={1} max={5} value={k} onChange={(e) => setK(Number(e.target.value))} className="w-full accent-violet-600" />
        </label>
        <p className="mt-2 rounded-xl bg-violet-50 p-3 text-sm dark:bg-violet-950">
          M<sup>{k}</sup>[A, F] = <strong>{Mk[0][5]}</strong> {Mk[0][5] === 1 ? 'recorrido' : 'recorridos'} de exactamente {k} tramos de A a F.
        </p>
        {actual && <p className="mt-2 font-mono text-sm" aria-live="polite">{i + 1}/{lista.length}: {actual.join(' → ')}</p>}
        {!actual && <p className="mt-2 text-sm text-slate-500">No hay recorridos de {k} tramos entre A y F.</p>}
      </div>
    </div>
  );
}

/* c) Matrices ponderadas */
export function WidgetPonderadas() {
  const [m, setM] = useState<'D' | 'T' | 'E'>('D');
  const datos = { D: MODELO_BASE.D, T: MODELO_BASE.T, E: MODELO_BASE.E }[m];
  const nombres = { D: 'Distancia (km)', T: 'Tiempo (min)', E: 'Esfuerzo (1-10)' };
  return (
    <div>
      <div className="mb-3 flex gap-2" role="tablist" aria-label="Elegir matriz">
        {(['D', 'T', 'E'] as const).map((x) => (
          <Boton key={x} tamano="sm" variante={m === x ? 'primario' : 'secundario'} role="tab" aria-selected={m === x} onClick={() => setM(x)}>{x}</Boton>
        ))}
      </div>
      <div className="inclinar"><TablaMatriz titulo={`${m}: ${nombres[m]}`} etiquetas={ET} datos={datos} /></div>
      <p className="text-xs text-slate-500">∞ significa «no hay calle directa» y la diagonal es 0 (ir de un lugar a sí mismo no cuesta nada).</p>
    </div>
  );
}

/* d) Combinación lineal */
export function WidgetCombinacion() {
  const [c, setC] = useState({ corta: 34, rapido: 33, tranquilo: 33 });
  const pesos = controlesAPesos(c);
  const modelo = useMemo(() => construirModelo(GRAFO_DEMO, pesos ?? { alfa: 1 / 3, beta: 1 / 3, gamma: 1 / 3 }), [pesos]);
  const r = useMemo(() => calcularRutas(GRAFO_DEMO, modelo, 0, 5).personalizada, [modelo]);
  const ids = r.ruta?.map((i) => ET[i]) ?? null;
  const deslizadores = [
    { k: 'corta' as const, t: 'α · distancia' },
    { k: 'rapido' as const, t: 'β · tiempo' },
    { k: 'tranquilo' as const, t: 'γ · esfuerzo' },
  ];
  return (
    <div className="grid items-center gap-5 sm:grid-cols-2">
      <div>
        <GrafoSVG grafo={GRAFO_DEMO} ruta={ids} etiquetaArista={(x) => `${x.d}·${x.t}·${x.e}`} aria="Grafo con la ruta óptima de A a F" />
        <p className="text-center text-[11px] text-slate-500">Etiquetas: km · min · esfuerzo</p>
      </div>
      <div>
        {deslizadores.map((d) => (
          <label key={d.k} className="mb-2 block text-sm">
            <span className="flex justify-between"><span className="font-medium">{d.t}</span><span className="font-mono text-xs">{c[d.k]}</span></span>
            <input type="range" min={0} max={100} value={c[d.k]} onChange={(e) => setC({ ...c, [d.k]: Number(e.target.value) })} className="w-full accent-blue-600" />
          </label>
        ))}
        {pesos ? (
          <p className="rounded-xl bg-blue-50 p-3 text-sm dark:bg-slate-800" aria-live="polite">
            C = {pesos.alfa.toFixed(2)}·D′ + {pesos.beta.toFixed(2)}·T′ + {pesos.gamma.toFixed(2)}·E′
            <br />Mejor ruta A→F: <strong className="font-mono">{ids?.join(' → ')}</strong>
          </p>
        ) : <p className="text-sm text-red-600">Suba al menos un peso por encima de 0.</p>}
        <p className="mt-2 text-xs text-slate-500">¿Por qué se normaliza? Los km, los minutos y el esfuerzo tienen unidades distintas; al dividir cada matriz entre su máximo quedan en (0, 1] y los pesos α, β, γ son comparables.</p>
      </div>
    </div>
  );
}

/* e) Dijkstra paso a paso */
export function WidgetDijkstra() {
  const T = MODELO_BASE.T;
  const res = useMemo(() => dijkstra(T, 0), [T]);
  const ruta = useMemo(() => rutaMinima(T, 0, 5), [T]);
  const [paso, setPaso] = useState(0);
  const [jugando, setJugando] = useState(false);
  const total = res.pasos.length;
  useEffect(() => {
    if (!jugando) return;
    if (paso >= total) return setJugando(false);
    const t = setTimeout(() => setPaso((p) => p + 1), 1300);
    return () => clearTimeout(t);
  }, [jugando, paso, total]);
  const actual = paso > 0 ? res.pasos[paso - 1] : null;
  const visitados = new Set(res.pasos.slice(0, paso).map((p) => ET[p.visitado]));
  const fin = paso >= total;
  return (
    <div className="grid items-center gap-5 sm:grid-cols-2">
      <GrafoSVG grafo={GRAFO_DEMO} nodosActivos={visitados} ruta={fin ? ruta.ruta?.map((i) => ET[i]) ?? null : null} etiquetaArista={(c) => String(c.t)} aria="Dijkstra sobre el grafo de ejemplo, minutos por calle" />
      <div>
        <div className="mb-3 flex gap-2">
          <Boton tamano="sm" variante="primario" onClick={() => { if (fin) setPaso(0); setJugando(!jugando); }} aria-label={jugando ? 'Pausar' : 'Reproducir'}>{jugando ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}{jugando ? 'Pausa' : 'Play'}</Boton>
          <Boton tamano="sm" disabled={fin} onClick={() => setPaso((p) => Math.min(total, p + 1))}><SkipForward size={15} aria-hidden /> Siguiente</Boton>
          <Boton tamano="sm" onClick={() => { setPaso(0); setJugando(false); }}><RotateCcw size={15} aria-hidden /> Reiniciar</Boton>
        </div>
        <table className="w-full border-collapse font-mono text-xs" aria-label="Distancias acumuladas desde A">
          <thead><tr className="bg-slate-100 dark:bg-slate-800">{ET.map((e) => <th key={e} className="px-1.5 py-1">{e}</th>)}</tr></thead>
          <tbody><tr>{ET.map((e, j) => <td key={e} className={`px-1.5 py-1 text-center ${actual?.actualizados.includes(j) ? 'bg-amber-200 font-bold text-slate-900' : ''}`}>{actual ? (Number.isFinite(actual.dist[j]) ? actual.dist[j] : '∞') : j === 0 ? 0 : '∞'}</td>)}</tr></tbody>
        </table>
        <p className="mt-2 text-sm" aria-live="polite">
          {fin ? <>Terminó: el camino más rápido de A a F es <strong className="font-mono">{ruta.ruta?.map((i) => ET[i]).join(' → ')}</strong> ({ruta.costo} min).</> : actual ? <>Paso {paso}: se fija el lugar <strong>{ET[actual.visitado]}</strong> y se mejoran los vecinos en amarillo.</> : 'Pulse Play: en cada paso se fija el lugar más cercano aún sin visitar.'}
        </p>
      </div>
    </div>
  );
}

/* f) Accesibilidad R */
export function WidgetAccesibilidad() {
  const [aislar, setAislar] = useState(false);
  const grafo: Grafo = useMemo(() => (aislar ? { ...GRAFO_DEMO, calles: GRAFO_DEMO.calles.filter((c) => c.a !== 'F' && c.b !== 'F') } : GRAFO_DEMO), [aislar]);
  const M = useMemo(() => matrizAdyacencia(grafo), [grafo]);
  const R = useMemo(() => accesibilidad(M), [M]);
  const apagadas = new Set(aislar ? ['D|F', 'E|F'] : []);
  const conexo = esConexo(R);
  return (
    <div className="grid items-center gap-5 sm:grid-cols-2">
      <GrafoSVG grafo={GRAFO_DEMO} aristasApagadas={apagadas} aria="Grafo de ejemplo, con las calles de F cortadas si se activa la casilla" />
      <div>
        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={aislar} onChange={(e) => setAislar(e.target.checked)} className="accent-blue-600" /> Cortar las calles que llegan a F
        </label>
        <p role="status" className={`mb-2 rounded-xl p-3 text-sm font-semibold ${conexo ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>
          {conexo ? 'Conexo: todos los r_ij > 0' : 'No conexo: F quedó aislado (su fila y columna tienen ceros)'}
        </p>
        <TablaMatriz titulo="R = I + M + M² + … + M⁵" etiquetas={ET} datos={R} />
      </div>
    </div>
  );
}

/* g) Isócronas */
export function WidgetIsocronas() {
  const [t, setT] = useState(10);
  const alc = useMemo(() => isocrona(MODELO_BASE.T, 0, t), [t]);
  const ids = new Set(alc.map((a) => ET[a.indice]));
  return (
    <div className="grid items-center gap-5 sm:grid-cols-2">
      <GrafoSVG grafo={GRAFO_DEMO} nodosActivos={ids} nodoEnfasis="A" aria="Lugares alcanzables desde A dentro del tiempo elegido" />
      <div>
        <label className="block text-sm font-medium">Tiempo máximo desde A: <span className="font-mono">{t} min</span>
          <input type="range" min={0} max={30} value={t} onChange={(e) => setT(Number(e.target.value))} className="w-full accent-amber-500" />
        </label>
        <ul className="mt-3 flex flex-wrap gap-2" aria-live="polite">
          {alc.map((a) => <li key={a.indice} className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">{ET[a.indice]} · {a.tiempo} min</li>)}
        </ul>
        <p className="mt-2 text-xs text-slate-500">Se usa Dijkstra sobre la matriz de tiempos T y se conservan los lugares con tiempo ≤ el máximo.</p>
      </div>
    </div>
  );
}
