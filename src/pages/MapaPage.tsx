import { ArrowLeft, HelpCircle, LocateFixed, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapaGL } from '../components/mapa/MapaGL';
import type { MapaGLRef } from '../components/mapa/MapaGL';
import { PanelMapa } from '../components/mapa/PanelMapa';
import { Tour } from '../components/mapa/Tour';
import { VistaRuta } from '../components/mapa/VistaRuta';
import { VistaAlcance, VistaAvanzada, VistaCaminos, VistaDatos, VistaEditor } from '../components/mapa/Vistas';
import { MapaSVG } from '../components/MapaSVG';
import { claseEnlaceBoton } from '../components/ui/Boton';
import { Boton } from '../components/ui/Boton';
import { Esqueleto } from '../components/ui/Esqueleto';
import { TemaBoton } from '../components/ui/TemaBoton';
import { DATOS_REALES } from '../data/datasetActivo';
import { hayWebGL, useEnLinea, useEscritorio } from '../hooks/useCapacidades';
import { useCalculos } from '../hooks/useCalculos';
import { leerEnlace } from '../lib/enlaces';
import { poligonoIsocrona, tieneCoordenadas, trazarRuta } from '../lib/geo';
import type { LngLat } from '../lib/geo';
import { useApp } from '../store/useApp';

export default function MapaPage() {
  const [params] = useSearchParams();
  const s = useApp();
  const calc = useCalculos();
  const escritorio = useEscritorio();
  const enLinea = useEnLinea();
  const refMapa = useRef<MapaGLRef>(null);
  const [anim, setAnim] = useState({ reproduciendo: true, ciclo: 0, terminada: false });
  const [mapaListo, setMapaListo] = useState(false);
  const [errorMapa, setErrorMapa] = useState<string | null>(null);
  const [claveMapa, setClaveMapa] = useState(0);
  const [forzarSVG, setForzarSVG] = useState(false);
  const usaGL = useMemo(() => tieneCoordenadas(s.grafo) && hayWebGL() && !forzarSVG, [s.grafo, forzarSVG]);

  useEffect(() => {
    document.title = 'Mapa · Mini Maps';
    const enlace = leerEnlace(params, useApp.getState().grafo.lugares.map((l) => l.id));
    if (Object.keys(enlace).length > 0) s.aplicarEnlace(enlace);
    else if (!useApp.getState().tourVisto) {
      const t = setTimeout(() => useApp.getState().iniciarTour(), 900);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esc: sale de una vista secundaria y vuelve a la ruta
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !useApp.getState().tourActivo && useApp.getState().vista !== 'ruta') useApp.getState().setVista('ruta');
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  // Trazados para el mapa
  const trazados = useMemo(() => {
    const r = calc.rutas;
    if (!r || calc.estado !== 'ok') return null;
    const aCoords = (id: 'personalizada' | 'tiempo' | 'distancia' | 'esfuerzo'): LngLat[] => (r[id].ruta ? trazarRuta(s.grafo, r[id].ruta as number[]) : []);
    const elegida = aCoords(s.alternativa);
    const otras = (['personalizada', 'tiempo', 'distancia', 'esfuerzo'] as const)
      .filter((id) => id !== s.alternativa && r[id].ruta && r[id].ruta?.join() !== r[s.alternativa].ruta?.join())
      .map(aCoords);
    return { elegida, otras };
  }, [calc.rutas, calc.estado, s.alternativa, s.grafo]);

  const mostrarRuta = s.vista !== 'alcance';
  const rutaCoords = mostrarRuta && trazados && trazados.elegida.length > 1 ? trazados.elegida : null;
  const alternativas = useMemo(() => (mostrarRuta && trazados ? trazados.otras : []), [mostrarRuta, trazados]);
  const isoPoligono = useMemo(() => (s.vista === 'alcance' ? poligonoIsocrona(s.grafo, calc.alcanzables, s.tMax) : null), [s.vista, s.grafo, calc.alcanzables, s.tMax]);
  const alcanzablesSet = useMemo(() => (s.vista === 'alcance' ? new Set(calc.alcanzables.map((a) => s.grafo.lugares[a.indice].id)) : null), [s.vista, calc.alcanzables, s.grafo]);

  // Reinicia la animación cuando cambia la ruta mostrada
  const claveRuta = `${s.origen}|${s.destino}|${s.alternativa}|${calc.rutas?.[s.alternativa].ruta?.join('-')}`;
  useEffect(() => {
    setAnim((a) => ({ reproduciendo: true, ciclo: a.ciclo + 1, terminada: false }));
  }, [claveRuta]);
  const reproducir = () =>
    setAnim((a) => (a.terminada ? { reproduciendo: true, ciclo: a.ciclo + 1, terminada: false } : { ...a, reproduciendo: !a.reproduciendo }));
  const alTerminar = useCallback(() => setAnim((a) => ({ ...a, reproduciendo: false, terminada: true })), []);

  const elegirDesdeMapa = (id: string, rol: 'origen' | 'destino') => {
    const nombre = s.grafo.lugares.find((l) => l.id === id)?.nombre.split(' – ')[0] ?? id;
    if (rol === 'origen') s.setOrigen(id);
    else s.setDestino(id);
    s.mostrarToast(`${rol === 'origen' ? 'Origen' : 'Destino'}: ${nombre}`);
  };
  // Mapa esquemático: 1.er clic origen, 2.º destino
  const clicEsquematico = (id: string) => {
    if (!s.origen || (s.origen && s.destino)) {
      s.setOrigen(id);
      s.setDestino(null);
    } else if (id !== s.origen) s.setDestino(id);
  };

  const relleno = escritorio ? { izq: 420, abajo: 0 } : { izq: 0, abajo: Math.round(window.innerHeight * 0.45) };
  const etiquetaDatos = s.ejemplo ? `Ejercicio del documento · mapa esquemático` : DATOS_REALES ? 'Datos reales OSM · tiempos sin tráfico · esfuerzo estimado' : 'Datos ilustrativos';

  return (
    <div className="relative h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Barra superior */}
      <header className="absolute inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <Link to="/" className={claseEnlaceBoton('secundario', 'sm')} aria-label="Volver al inicio">
          <ArrowLeft size={16} aria-hidden /> Inicio
        </Link>
        <h1 tabIndex={-1} className="text-base font-bold">🗺️ Mapa</h1>
        <span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline ${s.ejemplo ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' : DATOS_REALES ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
          {etiquetaDatos}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {s.ejemplo && <Boton tamano="sm" variante="primario" onClick={() => { s.restablecer(); s.mostrarToast('Mapa restablecido'); }}>Restablecer mapa</Boton>}
          <Link to="/guia" className={`${claseEnlaceBoton('fantasma', 'sm')} hidden sm:inline-flex`}>Guía</Link>
          <button data-tour="ayuda" onClick={s.iniciarTour} aria-label="Mostrar el recorrido guiado" className="rounded-xl border border-slate-300 p-2 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:hover:bg-slate-800">
            <HelpCircle size={18} aria-hidden />
          </button>
          <TemaBoton />
        </div>
      </header>

      {/* Mapa */}
      <main className="absolute inset-0 pt-14" aria-label="Mapa">
        <div className="relative h-full w-full">
          {usaGL ? (
            <>
              <MapaGL
                key={claveMapa}
                ref={refMapa}
                grafo={s.grafo}
                oscuro={s.tema === 'oscuro'}
                origen={s.origen}
                destino={s.destino}
                vista={s.vista}
                ruta={rutaCoords}
                alternativas={alternativas}
                isoPoligono={isoPoligono}
                alcanzables={alcanzablesSet}
                reproduciendo={anim.reproduciendo}
                ciclo={anim.ciclo}
                onFin={alTerminar}
                onElegir={elegirDesdeMapa}
                relleno={relleno}
                onListo={() => setMapaListo(true)}
                onError={setErrorMapa}
              />
              {!mapaListo && !errorMapa && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-slate-100 dark:bg-slate-950" aria-live="polite">
                  <div className="w-64 space-y-3 text-center">
                    <Esqueleto className="h-40 w-full" />
                    <Esqueleto className="mx-auto h-3 w-40" />
                    <p className="text-sm text-slate-500">Cargando el mapa…</p>
                  </div>
                </div>
              )}
              {mapaListo && (
                <button onClick={() => refMapa.current?.vistaInicial()} aria-label="Volver a la vista inicial del mapa" title="Vista inicial" className="absolute right-[10px] top-[8.5rem] z-10 grid h-[29px] w-[29px] place-items-center rounded bg-white shadow ring-1 ring-black/10 hover:bg-slate-100 dark:bg-slate-800 dark:text-white">
                  <LocateFixed size={16} aria-hidden />
                </button>
              )}
            </>
          ) : (
            <div className="h-full w-full p-3 pl-3 lg:pl-[420px]">
              <div className="h-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                <MapaSVG
                  grafo={s.grafo}
                  origen={s.origen}
                  destino={s.vista === 'alcance' ? null : s.destino}
                  ruta={mostrarRuta ? calc.rutas?.[s.alternativa].ruta?.map((i) => s.grafo.lugares[i].id) ?? null : null}
                  isocrona={s.vista === 'alcance' ? new Map(calc.alcanzables.map((a) => [s.grafo.lugares[a.indice].id, a.tiempo] as const)) : null}
                  etiquetaCalle={(c) => String(c.t)}
                  onSeleccionar={clicEsquematico}
                />
              </div>
              <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-[11px] text-slate-600 shadow dark:bg-slate-900/90 dark:text-slate-300">
                Mapa esquemático · las etiquetas muestran minutos · toque un lugar para elegir origen y destino
              </p>
            </div>
          )}

          {!enLinea && (
            <div role="alert" className="absolute left-1/2 top-16 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-lg lg:left-[calc(50%+200px)]">
              <WifiOff size={16} aria-hidden /> Sin conexión: el mapa base puede no verse, pero los cálculos siguen funcionando.
            </div>
          )}
          {errorMapa && (
            <div role="alert" className="absolute left-1/2 top-16 z-20 w-[min(92vw,460px)] -translate-x-1/2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900 shadow-lg dark:border-red-800 dark:bg-red-950 dark:text-red-100 lg:left-[calc(50%+200px)]">
              <p className="font-semibold">{errorMapa}</p>
              <div className="mt-2 flex gap-2">
                <Boton tamano="sm" variante="primario" onClick={() => { setErrorMapa(null); setMapaListo(false); setClaveMapa((c) => c + 1); }}>Reintentar</Boton>
                <Boton tamano="sm" onClick={() => { setErrorMapa(null); setForzarSVG(true); }}>Usar mapa esquemático</Boton>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Panel */}
      <PanelMapa forzarAlto={s.tourActivo}>
        {s.vista === 'ruta' && <VistaRuta calc={calc} reproduciendo={anim.reproduciendo} terminada={anim.terminada} onReproducir={reproducir} />}
        {s.vista === 'alcance' && <VistaAlcance calc={calc} />}
        {s.vista === 'caminos' && <VistaCaminos calc={calc} />}
        {s.vista === 'avanzado' && <VistaAvanzada calc={calc} />}
        {s.vista === 'editor' && <VistaEditor />}
        {s.vista === 'datos' && <VistaDatos />}
      </PanelMapa>

      {s.tourActivo && <Tour />}
    </div>
  );
}
