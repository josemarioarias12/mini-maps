import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useApp } from '../../store/useApp';
import { Boton } from '../ui/Boton';

const PASOS = [
  { sel: '[data-tour="buscador"]', titulo: '1 · Elija origen y destino', texto: 'Escriba el nombre de un lugar o toque un punto del mapa y elija «Usar como origen» o «Usar como destino».' },
  { sel: '[data-tour="controles"]', titulo: '2 · Diga qué le importa', texto: 'Mueva «Llegar rápido», «Ruta corta» y «Camino tranquilo». La ruta se recalcula al instante.' },
  { sel: '[data-tour="resultados"]', titulo: '3 · Compare las rutas', texto: 'Toque una tarjeta para verla en el mapa. Abajo están las indicaciones paso a paso.' },
  { sel: '[data-tour="acciones"]', titulo: '4 · Más herramientas', texto: '«¿Hasta dónde llego?» sombrea la zona alcanzable en un tiempo; «¿De cuántas formas?» cuenta recorridos.' },
  { sel: '[data-tour="ayuda"]', titulo: '5 · ¿Dudas?', texto: 'Este botón «?» vuelve a mostrar este recorrido cuando quiera. También hay una guía completa.' },
];

/** Recorrido guiado: resalta cada elemento con Siguiente / Atrás / Saltar. Esc lo cierra. */
export function Tour() {
  const cerrar = useApp((s) => s.cerrarTour);
  const [i, setI] = useState(0);
  const [caja, setCaja] = useState<DOMRect | null>(null);
  const tarjeta = useRef<HTMLDivElement>(null);
  const paso = PASOS[i];

  useLayoutEffect(() => {
    const medir = () => {
      const el = document.querySelector(paso.sel);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        const r = el.getBoundingClientRect();
        setCaja(r.width > 0 && r.height > 0 ? r : null);
      } else setCaja(null);
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [paso.sel]);

  useEffect(() => {
    tarjeta.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar();
      if (e.key === 'ArrowRight') setI((n) => Math.min(PASOS.length - 1, n + 1));
      if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [cerrar]);

  const ancho = Math.min(340, window.innerWidth - 24);
  const izq = caja ? Math.min(Math.max(12, caja.left), window.innerWidth - ancho - 12) : (window.innerWidth - ancho) / 2;
  const abajoLibre = caja ? window.innerHeight - caja.bottom : window.innerHeight;
  const top = caja ? (abajoLibre > 190 ? caja.bottom + 12 : Math.max(12, caja.top - 190)) : window.innerHeight / 2 - 90;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Recorrido guiado">
      {caja ? (
        <div className="pointer-events-none fixed rounded-xl transition-all duration-300" style={{ left: caja.left - 6, top: caja.top - 6, width: caja.width + 12, height: caja.height + 12, boxShadow: '0 0 0 9999px rgba(2,6,23,.62)', outline: '2px solid #60a5fa' }} />
      ) : (
        <div className="fixed inset-0 bg-slate-950/60" />
      )}
      <div ref={tarjeta} tabIndex={-1} className="fixed rounded-2xl bg-white p-4 shadow-2xl outline-none dark:bg-slate-900" style={{ left: izq, top, width: ancho }}>
        <h2 className="text-base font-bold">{paso.titulo}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{paso.texto}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">{i + 1} de {PASOS.length}</span>
          <div className="flex gap-2">
            <Boton tamano="sm" variante="fantasma" onClick={cerrar}>Saltar</Boton>
            {i > 0 && <Boton tamano="sm" onClick={() => setI(i - 1)}>Atrás</Boton>}
            <Boton tamano="sm" variante="primario" onClick={() => (i === PASOS.length - 1 ? cerrar() : setI(i + 1))}>{i === PASOS.length - 1 ? 'Listo' : 'Siguiente'}</Boton>
          </div>
        </div>
      </div>
    </div>
  );
}
