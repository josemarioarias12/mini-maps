import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}

/** Diálogo accesible: se cierra con X, clic fuera y Esc; devuelve el foco al cerrarse. */
export function Modal({ titulo, onCerrar, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCerrar();
      }
    };
    window.addEventListener('keydown', tecla, true);
    return () => {
      window.removeEventListener('keydown', tecla, true);
      previo?.focus?.();
    };
  }, [onCerrar]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onCerrar}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl outline-none dark:bg-slate-900"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
