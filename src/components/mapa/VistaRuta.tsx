import { Clock, Compass, Database, Footprints, Link2, Mountain, Pause, Pencil, Play, Route, Share2, Zap } from 'lucide-react';
import { useState } from 'react';
import type { Calculos } from '../../hooks/useCalculos';
import { CONTROLES_EQUILIBRADOS } from '../../lib/controles';
import type { Controles } from '../../lib/controles';
import { crearEnlace } from '../../lib/enlaces';
import { indicaciones } from '../../lib/indicaciones';
import type { RutaCalculada } from '../../lib/modelo';
import { useApp } from '../../store/useApp';
import type { Alternativa } from '../../store/useApp';
import { Aviso } from '../ui/basicos';
import { Boton } from '../ui/Boton';
import { BuscadorLugar } from './BuscadorLugar';

interface Props {
  calc: Calculos;
  reproduciendo: boolean;
  terminada: boolean;
  onReproducir: () => void;
}

const ALTERNATIVAS: { id: Alternativa; titulo: string; icono: typeof Clock }[] = [
  { id: 'personalizada', titulo: 'Personalizada', icono: Compass },
  { id: 'tiempo', titulo: 'Más rápida', icono: Zap },
  { id: 'distancia', titulo: 'Más corta', icono: Route },
  { id: 'esfuerzo', titulo: 'Menor esfuerzo', icono: Mountain },
];

const PREAJUSTES: { nombre: string; c: Controles }[] = [
  { nombre: 'Equilibrada', c: CONTROLES_EQUILIBRADOS },
  { nombre: 'Lo más rápido', c: { rapido: 100, corta: 0, tranquilo: 0 } },
  { nombre: 'Lo más corto', c: { rapido: 0, corta: 100, tranquilo: 0 } },
  { nombre: 'Lo más tranquilo', c: { rapido: 0, corta: 0, tranquilo: 100 } },
];

const MENSAJES = {
  'sin-seleccion': { tipo: 'info', texto: 'Elija un origen y un destino para ver la ruta. También puede tocar un lugar en el mapa.' },
  'mismo-lugar': { tipo: 'info', texto: 'El origen y el destino son el mismo lugar. Elija un destino distinto.' },
  'pesos-invalidos': { tipo: 'error', texto: 'Mueva al menos uno de los controles de preferencia por encima de cero.' },
  'sin-ruta': { tipo: 'error', texto: 'No hay ninguna ruta entre estos dos lugares: quedaron en zonas desconectadas del mapa.' },
} as const;

function TarjetaRuta({ r, titulo, Icono, activa, onClick, igualA }: { r: RutaCalculada; titulo: string; Icono: typeof Clock; activa: boolean; onClick: () => void; igualA: string | null }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activa}
      className={`w-full rounded-xl border p-3 text-left transition-all ${activa ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/30 dark:bg-slate-800' : 'border-slate-200 hover:border-slate-400 dark:border-slate-700'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icono size={16} aria-hidden /> {titulo}
        </span>
        <span className="text-lg font-bold">{r.totales ? `${Math.round(r.totales.t)} min` : '—'}</span>
      </div>
      <div className="mt-1 flex gap-3 text-xs text-slate-600 dark:text-slate-300">
        <span>{r.totales ? `${r.totales.d.toFixed(1)} km` : ''}</span>
        <span>{r.totales ? `Esfuerzo ${r.totales.e}` : ''}</span>
        {igualA && <span className="text-blue-700 dark:text-sky-300">igual a «{igualA}»</span>}
      </div>
    </button>
  );
}

/** Vista principal del panel: origen/destino, preferencias en lenguaje simple y resultados. */
export function VistaRuta({ calc, reproduciendo, terminada, onReproducir }: Props) {
  const s = useApp();
  const [verPasos, setVerPasos] = useState(true);
  const lugares = s.grafo.lugares;
  const mensaje = calc.estado !== 'ok' ? MENSAJES[calc.estado] : null;
  const ruta = calc.rutas?.[s.alternativa];
  const clave = (r: RutaCalculada) => r.ruta?.join('-') ?? '';
  const nombreAlt = (a: Alternativa) => ALTERNATIVAS.find((x) => x.id === a)?.titulo ?? '';
  const pasos = ruta?.ruta ? indicaciones(s.grafo, ruta.ruta) : [];

  const deslizadores: { clave: keyof Controles; titulo: string; ayuda: string; Icono: typeof Clock; letra: string }[] = [
    { clave: 'rapido', titulo: 'Llegar rápido', ayuda: 'Prefiere el menor tiempo de viaje', Icono: Clock, letra: 'β · tiempo' },
    { clave: 'corta', titulo: 'Ruta corta', ayuda: 'Prefiere recorrer menos kilómetros', Icono: Footprints, letra: 'α · distancia' },
    { clave: 'tranquilo', titulo: 'Camino tranquilo', ayuda: 'Evita pendientes, curvas y zonas congestionadas', Icono: Mountain, letra: 'γ · esfuerzo' },
  ];

  const copiarEnlace = async () => {
    const url = window.location.origin + crearEnlace({ origen: s.origen ?? undefined, destino: s.destino ?? undefined, controles: s.controles });
    try {
      await navigator.clipboard.writeText(url);
      s.mostrarToast('Enlace copiado al portapapeles');
    } catch {
      s.mostrarToast('No se pudo copiar el enlace. Copie la dirección del navegador.');
    }
  };

  return (
    <div>
      <div data-tour="buscador" className="space-y-2">
        <BuscadorLugar etiqueta="Origen" valor={s.origen} lugares={lugares} onChange={s.setOrigen} color="verde" placeholder="¿Desde dónde sale?" />
        <div className="flex justify-center">
          <Boton variante="fantasma" tamano="sm" onClick={s.intercambiar} aria-label="Intercambiar origen y destino">
            ⇅ Intercambiar
          </Boton>
        </div>
        <BuscadorLugar etiqueta="Destino" valor={s.destino} lugares={lugares} onChange={s.setDestino} color="rojo" placeholder="¿A dónde va?" />
      </div>

      <section data-tour="controles" className="mt-5" aria-label="Preferencias de ruta">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold">¿Qué es más importante para usted?</h3>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
            <input type="checkbox" checked={s.avanzado} onChange={(e) => s.setAvanzado(e.target.checked)} className="accent-blue-600" />
            Modo avanzado (álgebra)
          </label>
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {PREAJUSTES.map((p) => (
            <Boton key={p.nombre} tamano="sm" variante="secundario" onClick={() => s.setControles(p.c)} className="!px-2.5 !py-1 text-xs">
              {p.nombre}
            </Boton>
          ))}
        </div>
        {deslizadores.map(({ clave: k, titulo, ayuda, Icono, letra }) => (
          <label key={k} className="mb-2.5 block">
            <span className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Icono size={15} aria-hidden /> {titulo}
              </span>
              <span className="font-mono text-xs text-slate-500">
                {s.controles[k]}
                {s.avanzado && calc.pesos ? ` → ${letra} ${Math.round(calc.pesos[k === 'rapido' ? 'beta' : k === 'corta' ? 'alfa' : 'gamma'] * 100)} %` : ''}
              </span>
            </span>
            <input type="range" min={0} max={100} value={s.controles[k]} onChange={(e) => s.setControles({ ...s.controles, [k]: Number(e.target.value) })} className="w-full accent-blue-600" aria-describedby={`ayuda-${k}`} />
            <span id={`ayuda-${k}`} className="text-xs text-slate-500">{ayuda}</span>
          </label>
        ))}
        {s.avanzado && (
          <div className="mt-2 rounded-xl bg-slate-100 p-3 font-mono text-xs dark:bg-slate-800">
            C = α·D′ + β·T′ + γ·E′
            {calc.pesos && (
              <div className="mt-1 text-slate-600 dark:text-slate-300">
                α = {calc.pesos.alfa.toFixed(2)} · β = {calc.pesos.beta.toFixed(2)} · γ = {calc.pesos.gamma.toFixed(2)}
              </div>
            )}
            <Boton tamano="sm" variante="secundario" className="mt-2 !font-sans" onClick={() => s.setVista('avanzado')}>
              Ver matrices y pasos de Dijkstra
            </Boton>
          </div>
        )}
      </section>

      <section data-tour="resultados" className="mt-5" aria-label="Resultados">
        {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
        {calc.rutas && calc.estado === 'ok' && (
          <>
            <h3 className="mb-2 text-sm font-bold">Rutas disponibles</h3>
            <div className="space-y-2">
              {ALTERNATIVAS.map(({ id, titulo, icono }) => {
                const r = calc.rutas![id];
                const igual = id === 'personalizada' ? ALTERNATIVAS.find((a) => a.id !== 'personalizada' && clave(calc.rutas![a.id]) === clave(r))?.id : null;
                return <TarjetaRuta key={id} r={r} titulo={titulo} Icono={icono} activa={s.alternativa === id} onClick={() => s.setAlternativa(id)} igualA={igual ? nombreAlt(igual) : null} />;
              })}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Boton variante="primario" tamano="sm" onClick={onReproducir}>
                {reproduciendo ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
                {reproduciendo ? 'Pausar recorrido' : terminada ? 'Repetir recorrido' : 'Reproducir recorrido'}
              </Boton>
            </div>
            <div className="mt-4">
              <button className="mb-2 text-sm font-bold underline-offset-2 hover:underline" onClick={() => setVerPasos(!verPasos)} aria-expanded={verPasos}>
                Indicaciones paso a paso {verPasos ? '▾' : '▸'}
              </button>
              {verPasos && (
                <ol className="space-y-2 border-l-2 border-blue-200 pl-4 dark:border-slate-700">
                  {pasos.map((p, i) => (
                    <li key={i} className="relative text-sm">
                      <span className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden />
                      <div className="font-medium">{p.texto}</div>
                      {p.detalle && <div className="text-xs text-slate-500">{p.detalle}</div>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">Tiempos sin tráfico en tiempo real. El esfuerzo es una estimación (pendiente, curvas y congestión).</p>
          </>
        )}
      </section>

      <section data-tour="acciones" className="mt-5 grid grid-cols-2 gap-2" aria-label="Más herramientas">
        <Boton tamano="sm" onClick={() => s.setVista('alcance')}><Compass size={15} aria-hidden /> ¿Hasta dónde llego?</Boton>
        <Boton tamano="sm" onClick={() => s.setVista('caminos')}><Route size={15} aria-hidden /> ¿De cuántas formas?</Boton>
        <Boton tamano="sm" onClick={() => s.setVista('editor')}><Pencil size={15} aria-hidden /> Editar el mapa</Boton>
        <Boton tamano="sm" onClick={() => s.setVista('datos')}><Database size={15} aria-hidden /> Sobre los datos</Boton>
        <Boton tamano="sm" onClick={copiarEnlace} className="col-span-2"><Link2 size={15} aria-hidden /> <Share2 size={15} aria-hidden className="hidden" /> Copiar enlace de esta ruta</Boton>
      </section>
    </div>
  );
}
