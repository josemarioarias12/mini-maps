import { useEffect, useMemo, useState } from 'react';
import type { Calle, Grafo, Pesos } from './lib/tipos';
import { indiceDe, normalizarPesos } from './lib/matrices';
import { calcularRutas, construirModelo } from './lib/modelo';
import { isocrona } from './lib/isocronas';
import { GRAFO_EJEMPLO, copiarGrafo } from './data/ejemplo';
import { MapaSVG } from './components/MapaSVG';
import { TabRuta } from './components/TabRuta';
import { TabIsocronas } from './components/TabIsocronas';
import { TabMatrices } from './components/TabMatrices';
import { TabAccesibilidad } from './components/TabAccesibilidad';
import { TabEjemplos } from './components/TabEjemplos';
import { TabEditor } from './components/TabEditor';
import { TabAyuda } from './components/TabAyuda';

type Pestana = 'ruta' | 'isocronas' | 'matrices' | 'accesibilidad' | 'ejemplos' | 'editor' | 'ayuda';
type MetricaMapa = 'd' | 't' | 'e' | 'c';

const PESTANAS: { id: Pestana; nombre: string }[] = [
  { id: 'ruta', nombre: 'Ruta' },
  { id: 'isocronas', nombre: 'Isócronas' },
  { id: 'matrices', nombre: 'Matrices' },
  { id: 'accesibilidad', nombre: 'Accesibilidad / Potencias' },
  { id: 'ejemplos', nombre: 'Ejemplos del documento' },
  { id: 'editor', nombre: 'Editor' },
  { id: 'ayuda', nombre: 'Ayuda' },
];

const METRICAS: { id: MetricaMapa; nombre: string }[] = [
  { id: 'd', nombre: 'Distancia (km)' },
  { id: 't', nombre: 'Tiempo (min)' },
  { id: 'e', nombre: 'Esfuerzo' },
  { id: 'c', nombre: 'Costo C' },
];

export default function App() {
  const [grafo, setGrafo] = useState<Grafo>(() => copiarGrafo(GRAFO_EJEMPLO));
  const [origen, setOrigen] = useState<string | null>('SAN');
  const [destino, setDestino] = useState<string | null>('CAR');
  const [pesosUI, setPesosUI] = useState<Pesos>({ alfa: 34, beta: 33, gamma: 33 });
  const [pestana, setPestana] = useState<Pestana>('ruta');
  const [metrica, setMetrica] = useState<MetricaMapa>('t');
  const [tMax, setTMax] = useState(45);
  const [k, setK] = useState(2);
  const [oscuro, setOscuro] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro);
  }, [oscuro]);

  // Si se elimina un lugar seleccionado, se limpia la selección.
  useEffect(() => {
    if (origen && indiceDe(grafo, origen) < 0) setOrigen(null);
    if (destino && indiceDe(grafo, destino) < 0) setDestino(null);
  }, [grafo, origen, destino]);

  const pesos = useMemo(() => normalizarPesos(pesosUI), [pesosUI]);
  const modelo = useMemo(() => construirModelo(grafo, pesos ?? { alfa: 1 / 3, beta: 1 / 3, gamma: 1 / 3 }), [grafo, pesos]);
  const oi = origen ? indiceDe(grafo, origen) : -1;
  const di = destino ? indiceDe(grafo, destino) : -1;

  const rutas = useMemo(
    () => (pesos && oi >= 0 && di >= 0 && oi !== di ? calcularRutas(grafo, modelo, oi, di) : null),
    [grafo, modelo, pesos, oi, di],
  );
  const alcanzables = useMemo(() => (oi >= 0 ? isocrona(modelo.T, oi, tMax) : []), [modelo.T, oi, tMax]);

  const rutaIds = pestana === 'ruta' || pestana === 'ejemplos' ? rutas?.personalizada.ruta?.map((i) => grafo.lugares[i].id) ?? null : null;
  const isoMapa = pestana === 'isocronas' && oi >= 0 ? new Map(alcanzables.map((a) => [grafo.lugares[a.indice].id, a.tiempo] as const)) : null;
  const destinoVisible = pestana === 'isocronas' ? null : destino;

  const etiquetaCalle = (c: Calle): string => {
    if (metrica === 'd') return String(c.d);
    if (metrica === 't') return String(c.t);
    if (metrica === 'e') return String(c.e);
    const i = indiceDe(grafo, c.a);
    const j = indiceDe(grafo, c.b);
    return modelo.C[i][j].toFixed(2);
  };

  /** Clic en el mapa: 1.º origen, 2.º destino; con ambos fijados, reinicia el origen. */
  const seleccionar = (id: string) => {
    if (pestana === 'isocronas') return setOrigen(id);
    if (!origen) return setOrigen(id);
    if (!destino && id !== origen) return setDestino(id);
    setOrigen(id);
    setDestino(null);
  };

  const cargarEjercicio = (g: Grafo, o: string, d: string, p: Pesos) => {
    setGrafo(copiarGrafo(g));
    setOrigen(o);
    setDestino(d);
    setPesosUI(p);
    setMetrica('t');
  };

  const restablecer = () => {
    setGrafo(copiarGrafo(GRAFO_EJEMPLO));
    setOrigen('SAN');
    setDestino('CAR');
    setPesosUI({ alfa: 34, beta: 33, gamma: 33 });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:h-screen lg:flex-row">
      <aside className="order-2 flex w-full flex-col border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:order-1 lg:h-full lg:w-[470px] lg:border-r lg:border-t-0 xl:w-[540px]">
        <header className="flex items-center justify-between px-4 pb-2 pt-4">
          <div>
            <h1 className="text-lg font-bold leading-tight">🗺️ Mini Maps</h1>
            <p className="text-xs text-slate-500">Álgebra Lineal · grafos y matrices de adyacencia</p>
          </div>
          <button
            className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={() => setOscuro(!oscuro)}
            aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {oscuro ? '☀️ Claro' : '🌙 Oscuro'}
          </button>
        </header>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2" role="tablist" aria-label="Secciones">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={pestana === p.id}
              onClick={() => setPestana(p.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                pestana === p.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {p.nombre}
            </button>
          ))}
        </nav>
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2" role="tabpanel">
          {pestana === 'ruta' && (
            <TabRuta grafo={grafo} origen={origen} destino={destino} setOrigen={setOrigen} setDestino={setDestino} pesosUI={pesosUI} setPesosUI={setPesosUI} pesos={pesos} rutas={rutas} />
          )}
          {pestana === 'isocronas' && <TabIsocronas grafo={grafo} origen={origen} setOrigen={setOrigen} tMax={tMax} setTMax={setTMax} resultado={alcanzables} />}
          {pestana === 'matrices' && <TabMatrices grafo={grafo} modelo={modelo} pesos={pesos} />}
          {pestana === 'accesibilidad' && (
            <TabAccesibilidad grafo={grafo} modelo={modelo} origen={origen} destino={destino} setOrigen={setOrigen} setDestino={setDestino} k={k} setK={setK} />
          )}
          {pestana === 'ejemplos' && <TabEjemplos onCargar={cargarEjercicio} />}
          {pestana === 'editor' && <TabEditor grafo={grafo} setGrafo={setGrafo} onRestablecer={restablecer} />}
          {pestana === 'ayuda' && <TabAyuda />}
        </div>
      </aside>

      <main className="order-1 flex min-h-[60vh] flex-1 flex-col p-3 lg:order-2 lg:min-h-0">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold">Etiqueta de las calles:</span>
          {METRICAS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMetrica(m.id)}
              aria-pressed={metrica === m.id}
              className={`rounded-full px-2.5 py-1 font-medium ${metrica === m.id ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              {m.nombre}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
          <MapaSVG grafo={grafo} origen={origen} destino={destinoVisible} ruta={rutaIds} isocrona={isoMapa} etiquetaCalle={etiquetaCalle} onSeleccionar={seleccionar} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
          <span>🟢 Origen</span>
          <span>🟥 Destino</span>
          <span>🟦 Ruta</span>
          <span>🟧 Alcanzable (isócrona)</span>
          <span>Clic en un lugar para elegir origen y destino</span>
        </div>
      </main>
    </div>
  );
}
