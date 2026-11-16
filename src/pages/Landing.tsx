import { motion } from 'framer-motion';
import { ArrowRight, Calculator, CheckCircle2, MapPinned, MousePointerClick, SlidersHorizontal, Sparkles } from 'lucide-react';
import { lazy, Suspense, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GrafoSVG } from '../components/landing/GrafoSVG';
import {
  TarjetaConcepto,
  WidgetAccesibilidad,
  WidgetAdyacencia,
  WidgetCombinacion,
  WidgetDijkstra,
  WidgetIsocronas,
  WidgetPonderadas,
  WidgetPotencias,
} from '../components/landing/Widgets';
import { claseEnlaceBoton } from '../components/ui/Boton';
import { TemaBoton } from '../components/ui/TemaBoton';
import { GRAFO_DEMO } from '../data/demo';
import { resolverEj1, resolverEj2, resolverEj3 } from '../data/ejercicios';
import { puede3D, useEnPantalla } from '../hooks/useCapacidades';
import { crearEnlace } from '../lib/enlaces';

// La escena 3D (three.js) se descarga solo si el equipo puede mostrarla y el hero está a la vista.
const Escena3D = lazy(() => import('../components/landing/Escena3D'));

function Revelar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

/** Alternativa 2D elegante: grafo animado (se usa sin WebGL, con movimiento reducido o en equipos limitados). */
function Hero2D() {
  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/95 p-4 shadow-2xl">
      <GrafoSVG grafo={GRAFO_DEMO} ruta={['A', 'C', 'E', 'F']} etiquetaArista={(c) => String(c.t)} aria="Grafo de ejemplo con la ruta más rápida resaltada" />
      <p className="mt-1 text-center text-xs text-slate-500">Seis lugares, siete calles… y una ruta óptima.</p>
    </div>
  );
}

function Hero() {
  const [ref, visible] = useEnPantalla<HTMLDivElement>();
  const usar3D = useMemo(() => puede3D(), []);
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white" aria-labelledby="titulo-hero">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.18),transparent_50%)]" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 pb-20 pt-16 lg:grid-cols-2 lg:pt-24">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-sky-200">
            <Sparkles size={14} aria-hidden /> Proyecto de Álgebra Lineal · Universidad CENFOTEC
          </p>
          <h1 id="titulo-hero" className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            El álgebra lineal que hay <span className="text-amber-300">detrás de un mapa</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-300">
            Mini Maps calcula rutas con grafos, matrices y el algoritmo de Dijkstra. Elija cómo prefiere llegar —rápido, corto o tranquilo— y vea qué ruta propone la matemática.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/mapa" className={claseEnlaceBoton('primario', 'lg')}>
              Abrir el mapa <ArrowRight size={18} aria-hidden />
            </Link>
            <a href="#algebra" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10">
              Cómo funciona
            </a>
          </div>
        </div>
        <div ref={ref} className="relative h-[340px] sm:h-[420px]" aria-hidden={usar3D ? undefined : false}>
          {usar3D && visible ? (
            <Suspense fallback={<Hero2D />}>
              <Escena3D />
            </Suspense>
          ) : (
            <div className="grid h-full place-items-center">
              <Hero2D />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Navegacion() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
      <nav className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3" aria-label="Navegación principal">
        <Link to="/" className="text-lg font-black">🗺️ Mini Maps</Link>
        <div className="ml-6 hidden gap-5 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <a href="#que-es" className="hover:text-blue-600">¿Qué es?</a>
          <a href="#algebra" className="hover:text-blue-600">Álgebra lineal</a>
          <a href="#uso" className="hover:text-blue-600">Cómo se usa</a>
          <a href="#validacion" className="hover:text-blue-600">Validación</a>
          <Link to="/guia" className="hover:text-blue-600">Guía</Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <TemaBoton />
          <Link to="/mapa" className={claseEnlaceBoton('primario', 'sm')}>Abrir el mapa</Link>
        </div>
      </nav>
    </header>
  );
}

const TARJETAS = [
  { Icono: MapPinned, titulo: 'Un mapa que cualquiera puede usar', texto: 'Busque un lugar, toque el mapa y obtenga la ruta con indicaciones paso a paso, como en cualquier app de navegación.' },
  { Icono: Calculator, titulo: 'Matemática a la vista', texto: 'Cada ruta sale de matrices reales. Con un interruptor puede ver M, D, T, E y la matriz de costos que usa el programa.' },
  { Icono: SlidersHorizontal, titulo: 'Usted decide qué importa', texto: 'Combina distancia, tiempo y esfuerzo con pesos que usted ajusta. Cambie los controles y la ruta cambia con ellos.' },
];

const PASOS = [
  { Icono: MousePointerClick, titulo: 'Elija origen y destino', texto: 'Escriba un lugar o tóquelo en el mapa.' },
  { Icono: SlidersHorizontal, titulo: 'Diga qué le importa', texto: '«Llegar rápido», «Ruta corta» o «Camino tranquilo».' },
  { Icono: MapPinned, titulo: 'Compare y siga la ruta', texto: 'Vea las alternativas y reproduzca el recorrido.' },
];

export default function Landing() {
  const ejercicios = useMemo(() => [resolverEj1().coincide, resolverEj2().coincide, resolverEj3().coincide], []);
  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900">
        Saltar al contenido
      </a>
      <Navegacion />
      <main id="contenido">
        <Hero />

        <section id="que-es" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
          <Revelar>
            <h2 className="text-3xl font-black">¿Qué es Mini Maps?</h2>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">Un pequeño «Google Maps» construido desde cero para demostrar que detrás de cada ruta hay álgebra lineal.</p>
          </Revelar>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {TARJETAS.map(({ Icono, titulo, texto }, i) => (
              <Revelar key={titulo}>
                <motion.article whileHover={{ y: -4 }} transition={{ delay: i * 0.05 }} className="h-full rounded-tarjeta border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-sky-300"><Icono size={22} aria-hidden /></span>
                  <h3 className="mt-4 text-lg font-bold">{titulo}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{texto}</p>
                </motion.article>
              </Revelar>
            ))}
          </div>
        </section>

        <section id="algebra" className="scroll-mt-20 bg-slate-100 py-16 dark:bg-slate-900/50">
          <div className="mx-auto max-w-6xl px-5">
            <Revelar>
              <h2 className="text-3xl font-black">El álgebra lineal detrás del mapa</h2>
              <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">Siete ideas, cada una con una demostración interactiva. Pruebe los controles: todo se calcula en vivo con el mismo código que usa el mapa.</p>
            </Revelar>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <Revelar>
                <TarjetaConcepto id="adyacencia" titulo="1 · Grafos y matriz de adyacencia" formula="M[i][j] = 1 si hay calle entre i y j" texto="Los lugares son vértices y las calles son aristas. Toda la red cabe en una tabla de ceros y unos. Pase el cursor por un lugar para ver su fila." enlace={crearEnlace({ vista: 'avanzado' })}>
                  <WidgetAdyacencia />
                </TarjetaConcepto>
              </Revelar>
              <Revelar>
                <TarjetaConcepto id="potencias" titulo="2 · Potencias de la matriz" formula="(Mᵏ)[i][j] = recorridos de exactamente k tramos" texto="Multiplicar la matriz por sí misma cuenta, sin enumerar a mano, de cuántas formas se llega de un lugar a otro en k tramos." enlace={crearEnlace({ vista: 'caminos', origen: 'SAN', destino: 'CAR' })}>
                  <WidgetPotencias />
                </TarjetaConcepto>
              </Revelar>
              <Revelar>
                <TarjetaConcepto id="ponderadas" titulo="3 · Matrices ponderadas" formula="D (km) · T (min) · E (esfuerzo)" texto="Cada calle tiene tres costos. Donde no hay calle directa se escribe ∞, y la diagonal es 0 porque ir de un lugar a sí mismo no cuesta." enlace={crearEnlace({ vista: 'avanzado' })}>
                  <WidgetPonderadas />
                </TarjetaConcepto>
              </Revelar>
              <Revelar>
                <TarjetaConcepto id="combinacion" titulo="4 · Combinación lineal de costos" formula="C = α·D′ + β·T′ + γ·E′" texto="Los tres costos se normalizan (X′ = X / máx X) para poder sumarlos y se combinan con los pesos que usted elige. Cambie los controles y mire cómo cambia la ruta." enlace={crearEnlace({ origen: 'SAN', destino: 'CAR', controles: { corta: 70, rapido: 20, tranquilo: 10 } })}>
                  <WidgetCombinacion />
                </TarjetaConcepto>
              </Revelar>
              <Revelar>
                <TarjetaConcepto id="dijkstra" titulo="5 · Dijkstra paso a paso" formula="dist[v] = mín(dist[v], dist[u] + C[u][v])" texto="El algoritmo fija en cada paso el lugar más cercano y mejora las distancias de sus vecinos. Avance un paso a la vez o reprodúzcalo." enlace={crearEnlace({ vista: 'avanzado', origen: 'SAN', destino: 'CAR' })}>
                  <WidgetDijkstra />
                </TarjetaConcepto>
              </Revelar>
              <Revelar>
                <TarjetaConcepto id="accesibilidad" titulo="6 · Accesibilidad y conexidad" formula="R = I + M + M² + … + Mⁿ⁻¹" texto="Si todas las entradas de R son positivas, desde cualquier lugar se puede llegar a cualquier otro. Pruebe quitar calles y vea cuándo el mapa se desconecta." enlace={crearEnlace({ vista: 'caminos' })}>
                  <WidgetAccesibilidad />
                </TarjetaConcepto>
              </Revelar>
              <Revelar className="lg:col-span-2">
                <TarjetaConcepto id="isocronas" titulo="7 · Isócronas" formula="{ v : tiempo mínimo(origen → v) ≤ t }" texto="Corriendo Dijkstra sobre la matriz de tiempos se obtienen todos los lugares alcanzables en un tiempo máximo: la zona a la que usted llega." enlace={crearEnlace({ vista: 'alcance', origen: 'CEN', tMax: 30 })}>
                  <WidgetIsocronas />
                </TarjetaConcepto>
              </Revelar>
            </div>
          </div>
        </section>

        <section id="uso" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
          <Revelar>
            <h2 className="text-3xl font-black">Cómo se usa, en 3 pasos</h2>
          </Revelar>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {PASOS.map(({ Icono, titulo, texto }, i) => (
              <Revelar key={titulo}>
                <li className="h-full rounded-tarjeta border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-sm font-black text-blue-600">Paso {i + 1}</span>
                  <div className="mt-2 flex items-center gap-3"><Icono size={22} className="text-blue-600" aria-hidden /><h3 className="font-bold">{titulo}</h3></div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{texto}</p>
                </li>
              </Revelar>
            ))}
          </ol>
          <p className="mt-6"><Link to="/guia" className="font-semibold text-blue-600 hover:underline dark:text-sky-400">Ver la guía completa →</Link></p>
        </section>

        <section id="validacion" className="scroll-mt-20 bg-slate-100 py-16 dark:bg-slate-900/50">
          <div className="mx-auto max-w-6xl px-5">
            <Revelar>
              <h2 className="text-3xl font-black">Validado con ejercicios reales</h2>
              <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">El programa resuelve los tres ejercicios del Avance 1 y comprueba que su resultado coincide con el calculado a mano.</p>
            </Revelar>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {['Matriz de adyacencia y M²', 'Ruta más rápida A→B→C→D = 9 min', 'Accesibilidad R = I + M + M² + M³'].map((t, i) => (
                <li key={t} className="flex items-start gap-3 rounded-tarjeta border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <CheckCircle2 className={ejercicios[i] ? 'text-green-600' : 'text-red-600'} size={22} aria-hidden />
                  <div><p className="font-semibold">Ejercicio {i + 1}</p><p className="text-sm text-slate-600 dark:text-slate-300">{t}</p><p className="sr-only">{ejercicios[i] ? 'Coincide con el documento' : 'No coincide'}</p></div>
                </li>
              ))}
            </ul>
            <Link to="/verificacion" className={`${claseEnlaceBoton('primario')} mt-6`}>Ver la verificación completa</Link>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-20 text-center">
          <Revelar>
            <h2 className="text-3xl font-black">¿Listo para probarlo?</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-600 dark:text-slate-300">Abra el mapa, elija dos lugares y mueva los controles para ver cómo la matemática cambia el camino.</p>
            <Link to={crearEnlace({ origen: 'SAN', destino: 'CAR' })} className={`${claseEnlaceBoton('primario', 'lg')} mt-6`}>Abrir el mapa <ArrowRight size={18} aria-hidden /></Link>
          </Revelar>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <div className="mx-auto max-w-6xl space-y-2 px-5">
          <p><strong>Mini Maps</strong> · Álgebra Lineal · Universidad CENFOTEC · Profesor: Edwin Armando Quesada Solano</p>
          <p>Equipo: Jose Mario Arias Matamoros, Dylan Josue Chaves Hernández, Bryan Aleman Marcia y Alexander Gonzáles Castillo.</p>
          <p className="text-xs text-slate-500">Mapa base © OpenStreetMap contributors © CARTO · Elevación: Open-Meteo. Los tiempos son sin tráfico en tiempo real y el esfuerzo es una estimación.</p>
        </div>
      </footer>
    </div>
  );
}
