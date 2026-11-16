/** Marcador de carga (skeleton) con animación suave. */
export function Esqueleto({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`} />;
}
