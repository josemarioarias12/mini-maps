import { MotionConfig } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Esqueleto } from './components/ui/Esqueleto';
import { Toasts } from './components/ui/Toasts';
import { useApp } from './store/useApp';

// Cada página se carga solo cuando se visita (three y maplibre quedan en chunks aparte).
const Landing = lazy(() => import('./pages/Landing'));
const MapaPage = lazy(() => import('./pages/MapaPage'));
const Guia = lazy(() => import('./pages/Guia'));
const Verificacion = lazy(() => import('./pages/Verificacion'));
const NoEncontrado = lazy(() => import('./pages/NoEncontrado'));

const TITULOS: Record<string, string> = { '/': 'Inicio', '/mapa': 'Mapa', '/guia': 'Guía de uso', '/verificacion': 'Verificación' };

/** Al cambiar de página: restaura el scroll, mueve el foco al título y lo anuncia a lectores de pantalla. */
export function AnunciaRutas() {
  const { pathname, hash } = useLocation();
  const [mensaje, setMensaje] = useState('');
  useEffect(() => {
    const titulo = TITULOS[pathname] ?? 'Página no encontrada';
    document.title = `${titulo} · Mini Maps`;
    setMensaje(`Página: ${titulo}`);
    const t = setTimeout(() => {
      if (hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView();
      } else {
        window.scrollTo(0, 0);
        const h = document.querySelector<HTMLElement>('main h1, h1');
        h?.setAttribute('tabindex', '-1');
        h?.focus({ preventScroll: true });
      }
    }, 250); // espera a que cargue la página (lazy)
    return () => clearTimeout(t);
  }, [pathname, hash]);
  return (
    <div className="sr-only" role="status" aria-live="polite">
      {mensaje}
    </div>
  );
}

function CargandoPagina() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950" aria-busy="true">
      <div className="w-64 space-y-3 text-center">
        <Esqueleto className="h-32 w-full" />
        <Esqueleto className="mx-auto h-3 w-40" />
        <p className="text-sm text-slate-500">Cargando…</p>
      </div>
    </div>
  );
}

export default function App() {
  const tema = useApp((s) => s.tema);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'oscuro');
  }, [tema]);

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AnunciaRutas />
        <Suspense fallback={<CargandoPagina />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/mapa" element={<MapaPage />} />
            <Route path="/guia" element={<Guia />} />
            <Route path="/verificacion" element={<Verificacion />} />
            <Route path="*" element={<NoEncontrado />} />
          </Routes>
        </Suspense>
        <Toasts />
      </BrowserRouter>
    </MotionConfig>
  );
}
