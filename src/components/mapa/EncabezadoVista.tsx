import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { Boton } from '../ui/Boton';

/** Cabecera de toda vista secundaria del panel, con "← Volver a la ruta". */
export function EncabezadoVista({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children?: ReactNode }) {
  const setVista = useApp((s) => s.setVista);
  return (
    <div>
      <Boton variante="secundario" tamano="sm" onClick={() => setVista('ruta')} className="mb-3">
        <ArrowLeft size={16} aria-hidden /> Volver a la ruta
      </Boton>
      <h2 className="text-lg font-bold leading-tight">{titulo}</h2>
      {subtitulo && <p className="mb-3 mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitulo}</p>}
      {children}
    </div>
  );
}
