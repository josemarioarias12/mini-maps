import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Boton } from './Boton';

/** "← Volver": history.back() si hay historial dentro de la app; si no, va al inicio. */
export function BotonVolver({ etiqueta = 'Volver', className = '' }: { etiqueta?: string; className?: string }) {
  const navegar = useNavigate();
  const volver = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navegar(-1);
    else navegar('/', { replace: true });
  };
  return (
    <Boton variante="secundario" tamano="sm" onClick={volver} className={className} aria-label={`${etiqueta} a la página anterior`}>
      <ArrowLeft size={16} aria-hidden /> {etiqueta}
    </Boton>
  );
}
