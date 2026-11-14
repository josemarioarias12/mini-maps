import type { ReactNode } from 'react';
import type { Lugar } from '../lib/tipos';

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{titulo}</h3>
      {children}
    </section>
  );
}

export function Aviso({ tipo, children }: { tipo: 'error' | 'info' | 'ok'; children: ReactNode }) {
  const estilos = {
    error: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
    info: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
    ok: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  };
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`mb-3 rounded-lg border px-3 py-2 text-sm ${estilos[tipo]}`}>
      {children}
    </div>
  );
}

export function SelectorLugar(props: {
  etiqueta: string;
  valor: string | null;
  lugares: Lugar[];
  onChange: (id: string | null) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{props.etiqueta}</span>
      <select
        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900"
        value={props.valor ?? ''}
        onChange={(e) => props.onChange(e.target.value || null)}
      >
        <option value="">— elegir —</option>
        {props.lugares.map((l) => (
          <option key={l.id} value={l.id}>
            {l.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

export const clBoton =
  'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800';
export const clBotonPrimario =
  'rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';
export const clInput =
  'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900';
