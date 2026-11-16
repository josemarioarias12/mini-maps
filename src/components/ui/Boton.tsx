import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variante = 'primario' | 'secundario' | 'fantasma';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-[var(--mov-rapido)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]';
const variantes: Record<Variante, string> = {
  primario: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700',
  secundario: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
  fantasma: 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
};
const tamanos = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: keyof typeof tamanos;
  children: ReactNode;
}

export function Boton({ variante = 'secundario', tamano = 'md', className = '', children, ...resto }: Props) {
  return (
    <button type="button" className={`${base} ${variantes[variante]} ${tamanos[tamano]} ${className}`} {...resto}>
      {children}
    </button>
  );
}

/** Clases para enlaces (react-router Link) con aspecto de botón. */
export const claseEnlaceBoton = (variante: Variante = 'primario', tamano: keyof typeof tamanos = 'md'): string =>
  `${base} ${variantes[variante]} ${tamanos[tamano]}`;
