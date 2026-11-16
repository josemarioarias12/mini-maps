import { Compass, HelpCircle, MapPin, Route, SlidersHorizontal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Boton, claseEnlaceBoton } from '../components/ui/Boton';
import { BotonVolver } from '../components/ui/BotonVolver';
import { TemaBoton } from '../components/ui/TemaBoton';
import { crearEnlace } from '../lib/enlaces';
import { useApp } from '../store/useApp';

const PASOS = [
  { Icono: MapPin, titulo: 'Elija origen y destino', texto: 'Escriba el nombre de un lugar en «Origen» y «Destino», o toque un punto del mapa y elija «Origen aquí» o «Destino aquí». El botón ⇄ los intercambia.' },
  { Icono: SlidersHorizontal, titulo: 'Diga qué le importa', texto: 'Mueva «Llegar rápido», «Ruta corta» y «Camino tranquilo». No hace falta que sumen 100: el programa los ajusta solo. También hay combinaciones listas.' },
  { Icono: Route, titulo: 'Compare las rutas', texto: 'Cada tarjeta es una alternativa con su tiempo, distancia y esfuerzo. Toque una para verla en el mapa y despliegue «Indicaciones paso a paso».' },
  { Icono: Compass, titulo: 'Explore más herramientas', texto: '«¿Hasta dónde llego?» sombrea la zona alcanzable en un tiempo. «¿De cuántas formas?» cuenta recorridos. «Editar el mapa» permite agregar lugares y calles.' },
];

const ATAJOS: [string, string][] = [
  ['Tab / Shift + Tab', 'Moverse entre controles, lugares del mapa y botones'],
  ['↑ ↓ y Enter', 'Elegir un lugar en las listas de búsqueda'],
  ['Enter o Espacio', 'Abrir un lugar del mapa y elegirlo como origen o destino'],
  ['Esc', 'Cerrar una lista, un aviso o volver a la ruta desde otra vista'],
  ['Flechas, + y −', 'Mover el mapa y acercar o alejar (con el mapa enfocado)'],
];

const PREGUNTAS: [string, string][] = [
  ['¿Por qué los minutos no coinciden con Google Maps?', 'Los tiempos de Mini Maps son sin tráfico en tiempo real (velocidades libres del mapa de OpenStreetMap). Por eso suelen ser menores que los de una app con tráfico en vivo.'],
  ['¿Qué significa «esfuerzo»?', 'Es una estimación de 1 a 10 por calle que combina la pendiente, lo sinuosa que es la calle y un nivel de congestión típico asignado a mano. No es una medición.'],
  ['¿Qué es una isócrona?', 'La zona a la que se llega desde un lugar en un tiempo máximo. Aquí se calcula con el algoritmo de Dijkstra sobre la matriz de tiempos.'],
  ['¿Funciona sin internet?', 'Los cálculos sí. El mapa de fondo necesita conexión; si no carga, puede reintentar o usar el mapa esquemático.'],
  ['¿Cómo comparto una ruta?', 'En la vista de ruta use «Copiar enlace». El enlace guarda el origen, el destino y sus preferencias.'],
  ['¿Dónde están las matemáticas?', 'Active el modo avanzado en la vista de ruta para ver las matrices M, D, T, E, la matriz de costos C y los pasos de Dijkstra. En el inicio hay demostraciones de cada concepto.'],
];

export default function Guia() {
  const iniciarTour = useApp((s) => s.iniciarTour);
  const navegar = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <BotonVolver />
        <span className="ml-auto" />
        <TemaBoton />
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 tabIndex={-1} className="text-3xl font-black">Cómo usar Mini Maps</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">No necesita saber matemáticas: la guía le lleva de la mano en cuatro pasos.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to={crearEnlace({ origen: 'SAN', destino: 'CAR' })} className={claseEnlaceBoton('primario')}>Probar ahora en el mapa</Link>
          <Boton onClick={() => { iniciarTour(); navegar('/mapa'); }}><HelpCircle size={16} aria-hidden /> Repetir el recorrido guiado</Boton>
        </div>

        <h2 className="mt-10 text-xl font-bold">Primeros pasos</h2>
        <ol className="mt-4 space-y-4">
          {PASOS.map(({ Icono, titulo, texto }, i) => (
            <li key={titulo} className="flex gap-4 rounded-tarjeta border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-sky-300"><Icono size={20} aria-hidden /></span>
              <div><h3 className="font-bold">{i + 1}. {titulo}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{texto}</p></div>
            </li>
          ))}
        </ol>

        <h2 className="mt-10 text-xl font-bold">Qué verá en el mapa</h2>
        <ul className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-200">
          <li>🟢 Círculo verde con «O»: el origen.</li>
          <li>🟥 Cuadro rojo con «D»: el destino.</li>
          <li>🟦 Línea azul animada: la ruta elegida. Las otras alternativas se ven más tenues.</li>
          <li>🟧 Zona y calles naranjas: lo que alcanza en el tiempo de «¿Hasta dónde llego?».</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold">Atajos de teclado</h2>
        <dl className="mt-3 divide-y divide-slate-200 rounded-tarjeta border border-slate-200 bg-white text-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {ATAJOS.map(([tecla, desc]) => (
            <div key={tecla} className="flex flex-wrap gap-x-4 px-4 py-2.5">
              <dt className="w-44 shrink-0 font-mono text-xs font-semibold text-blue-700 dark:text-sky-300">{tecla}</dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-10 text-xl font-bold">Preguntas frecuentes</h2>
        <div className="mt-3 space-y-2">
          {PREGUNTAS.map(([p, r]) => (
            <details key={p} className="rounded-tarjeta border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <summary className="cursor-pointer font-semibold">{p}</summary>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{r}</p>
            </details>
          ))}
        </div>
      </main>
    </div>
  );
}
