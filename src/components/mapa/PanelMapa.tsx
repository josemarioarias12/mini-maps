import { ChevronsUpDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useEscritorio } from '../../hooks/useCapacidades';

const FRACCIONES = [0.16, 0.48, 0.86];

/**
 * Panel del mapa. En escritorio: tarjeta flotante a la izquierda.
 * En celular: bottom sheet arrastrable con 3 alturas (también con teclado y botón).
 */
export function PanelMapa({ children, forzarAlto }: { children: ReactNode; forzarAlto?: boolean }) {
  const escritorio = useEscritorio();
  const [snap, setSnap] = useState(1);
  const [alturaArrastre, setAlturaArrastre] = useState<number | null>(null);
  const inicio = useRef({ y: 0, h: 0 });
  const [vh, setVh] = useState(() => window.innerHeight);
  useEffect(() => {
    const f = () => setVh(window.innerHeight);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  useEffect(() => {
    if (forzarAlto) setSnap(2);
  }, [forzarAlto]);

  const alturas = FRACCIONES.map((f) => Math.round(vh * f));
  const alturaActual = alturaArrastre ?? alturas[snap];

  const empezar = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    inicio.current = { y: e.clientY, h: alturas[snap] };
    setAlturaArrastre(alturas[snap]);
  };
  const mover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (alturaArrastre === null) return;
    setAlturaArrastre(Math.min(alturas[2], Math.max(alturas[0] - 20, inicio.current.h + (inicio.current.y - e.clientY))));
  };
  const soltar = () => {
    if (alturaArrastre === null) return;
    const cercano = alturas.reduce((mejor, h, i) => (Math.abs(h - alturaArrastre) < Math.abs(alturas[mejor] - alturaArrastre) ? i : mejor), 0);
    setSnap(cercano);
    setAlturaArrastre(null);
  };

  if (escritorio) {
    return (
      <aside aria-label="Panel de rutas" className="absolute bottom-4 left-4 top-[4.25rem] z-20 flex w-[400px] flex-col overflow-hidden rounded-tarjeta border border-slate-200 bg-white/95 shadow-elevada backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex-1 overflow-y-auto p-4" data-panel-scroll>
          {children}
        </div>
      </aside>
    );
  }
  return (
    <aside
      aria-label="Panel de rutas"
      style={{ height: alturaActual, transition: alturaArrastre === null ? 'height .3s ease' : 'none' }}
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-3xl border-t border-slate-200 bg-white/95 shadow-elevada backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
    >
      <div
        className="flex cursor-grab touch-none flex-col items-center pb-1 pt-2 active:cursor-grabbing"
        onPointerDown={empezar}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
      >
        <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden />
        <button
          className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-500"
          onClick={() => setSnap((snap + 1) % 3)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') setSnap(Math.min(2, snap + 1));
            if (e.key === 'ArrowDown') setSnap(Math.max(0, snap - 1));
          }}
          aria-label="Cambiar el tamaño del panel"
        >
          <ChevronsUpDown size={13} aria-hidden /> Cambiar tamaño
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">{children}</div>
    </aside>
  );
}
