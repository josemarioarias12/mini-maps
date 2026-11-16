import { Moon, Sun } from 'lucide-react';
import { useApp } from '../../store/useApp';

export function TemaBoton({ className = '' }: { className?: string }) {
  const tema = useApp((s) => s.tema);
  const setTema = useApp((s) => s.setTema);
  const oscuro = tema === 'oscuro';
  return (
    <button
      onClick={() => setTema(oscuro ? 'claro' : 'oscuro')}
      aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className={`rounded-xl border border-slate-300 p-2 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 ${className}`}
    >
      {oscuro ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );
}
