import { MapPin, X } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import type { Lugar } from '../../lib/tipos';

const normalizar = (t: string): string => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

interface Props {
  etiqueta: string;
  valor: string | null;
  lugares: Lugar[];
  onChange: (id: string | null) => void;
  placeholder?: string;
  color?: 'verde' | 'rojo' | 'gris';
}

/** Campo con autocompletado (teclado y mouse): patrón combobox + listbox accesible. */
export function BuscadorLugar({ etiqueta, valor, lugares, onChange, placeholder = 'Buscar un lugar…', color = 'gris' }: Props) {
  const idBase = useId();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [activo, setActivo] = useState(0);
  const seleccionado = lugares.find((l) => l.id === valor) ?? null;

  const opciones = useMemo(() => {
    const q = normalizar(texto.trim());
    return lugares.filter((l) => q === '' || normalizar(l.nombre).includes(q) || normalizar(l.id).includes(q)).slice(0, 8);
  }, [lugares, texto]);

  const elegir = (l: Lugar) => {
    onChange(l.id);
    setAbierto(false);
    setTexto('');
  };

  const onTecla = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setActivo((a) => Math.min(opciones.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && abierto && opciones[activo]) {
      e.preventDefault();
      elegir(opciones[activo]);
    } else if (e.key === 'Escape' && abierto) {
      e.stopPropagation();
      setAbierto(false);
    }
  };

  const puntito = { verde: 'text-green-600', rojo: 'text-red-600', gris: 'text-slate-400' }[color];

  return (
    <div className="relative">
      <label htmlFor={`${idBase}-in`} className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
        {etiqueta}
      </label>
      <div className="relative">
        <MapPin size={16} aria-hidden className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 ${puntito}`} />
        <input
          id={`${idBase}-in`}
          role="combobox"
          aria-expanded={abierto}
          aria-controls={`${idBase}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={abierto && opciones[activo] ? `${idBase}-op-${opciones[activo].id}` : undefined}
          autoComplete="off"
          className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-8 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900"
          placeholder={placeholder}
          value={abierto ? texto : seleccionado?.nombre.split(' – ')[0] ?? ''}
          onFocus={() => {
            setAbierto(true);
            setTexto('');
            setActivo(0);
          }}
          onBlur={() => setAbierto(false)}
          onChange={(e) => {
            setTexto(e.target.value);
            setActivo(0);
            setAbierto(true);
          }}
          onKeyDown={onTecla}
        />
        {seleccionado && (
          <button
            type="button"
            aria-label={`Quitar ${etiqueta.toLowerCase()}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X size={14} aria-hidden />
          </button>
        )}
      </div>
      {abierto && (
        <ul
          id={`${idBase}-lista`}
          role="listbox"
          aria-label={`Lugares para ${etiqueta.toLowerCase()}`}
          className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-elevada dark:border-slate-700 dark:bg-slate-900"
        >
          {opciones.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Sin resultados</li>}
          {opciones.map((l, i) => (
            <li
              key={l.id}
              id={`${idBase}-op-${l.id}`}
              role="option"
              aria-selected={i === activo}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => elegir(l)}
              onMouseEnter={() => setActivo(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${i === activo ? 'bg-blue-50 dark:bg-slate-800' : ''}`}
            >
              {l.nombre.split(' – ')[0]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
