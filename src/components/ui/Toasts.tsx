import { X } from 'lucide-react';
import { useApp } from '../../store/useApp';

/** Avisos breves; cada uno puede traer una acción (p. ej. "Deshacer"). */
export function Toasts() {
  const toasts = useApp((s) => s.toasts);
  const cerrar = useApp((s) => s.cerrarToast);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-xl dark:bg-slate-100 dark:text-slate-900">
          <span>{t.mensaje}</span>
          {t.accion && (
            <button
              className="font-semibold text-sky-300 underline-offset-2 hover:underline dark:text-blue-700"
              onClick={() => {
                t.accion?.fn();
                cerrar(t.id);
              }}
            >
              {t.accion.texto}
            </button>
          )}
          <button aria-label="Cerrar aviso" onClick={() => cerrar(t.id)} className="opacity-70 hover:opacity-100">
            <X size={14} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
