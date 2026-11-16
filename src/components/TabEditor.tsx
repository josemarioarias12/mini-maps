import { useState } from 'react';
import type { Calle, Grafo } from '../lib/tipos';
import { Aviso, Seccion, clBoton, clBotonPrimario, clInput } from './ui/basicos';
import { tieneCoordenadas } from '../lib/geo';

interface Props {
  grafo: Grafo;
  setGrafo: (g: Grafo) => void;
  onRestablecer: () => void;
}

const num = (v: string, min: number, max: number): number => Math.min(max, Math.max(min, Number(v) || min));

/** Genera una sigla única de 3 letras a partir del nombre. */
function siglaUnica(nombre: string, existentes: string[]): string {
  const base = (nombre.normalize('NFD').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3) || 'LUG').padEnd(3, 'X');
  let s = base;
  let n = 2;
  while (existentes.includes(s)) s = `${base.slice(0, 2)}${n++}`;
  return s;
}

export function TabEditor({ grafo, setGrafo, onRestablecer }: Props) {
  const [nombre, setNombre] = useState('');
  const geo = tieneCoordenadas(grafo);
  const [x, setX] = useState(500);
  const [y, setY] = useState(300);
  const [lat, setLat] = useState(() => grafo.lugares[0]?.lat ?? 9.93);
  const [lng, setLng] = useState(() => grafo.lugares[0]?.lng ?? -84.08);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [nueva, setNueva] = useState({ d: 5, t: 10, e: 3 });
  const [error, setError] = useState<string | null>(null);

  const agregarLugar = () => {
    if (!nombre.trim()) return setError('Escriba un nombre para el lugar.');
    const id = siglaUnica(nombre, grafo.lugares.map((l) => l.id));
    setGrafo({ ...grafo, lugares: [...grafo.lugares, geo ? { id, nombre: nombre.trim(), x, y, lat, lng } : { id, nombre: nombre.trim(), x, y }] });
    setNombre('');
    setError(null);
  };

  const eliminarLugar = (id: string) =>
    setGrafo({ lugares: grafo.lugares.filter((l) => l.id !== id), calles: grafo.calles.filter((c) => c.a !== id && c.b !== id) });

  const agregarCalle = () => {
    if (!a || !b) return setError('Elija los dos lugares que conecta la calle.');
    if (a === b) return setError('Una calle debe conectar dos lugares distintos.');
    if (grafo.calles.some((c) => (c.a === a && c.b === b) || (c.a === b && c.b === a))) return setError('Esa calle ya existe: edite sus valores abajo.');
    setGrafo({ ...grafo, calles: [...grafo.calles, { a, b, ...nueva }] });
    setError(null);
  };

  const editarCalle = (i: number, campo: 'd' | 't' | 'e', valor: number) =>
    setGrafo({ ...grafo, calles: grafo.calles.map((c, k): Calle => (k === i ? { ...c, [campo]: valor } : c)) });

  const eliminarCalle = (i: number) => setGrafo({ ...grafo, calles: grafo.calles.filter((_, k) => k !== i) });
  const nom = (id: string) => grafo.lugares.find((l) => l.id === id)?.id ?? id;

  return (
    <div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <Seccion titulo="Agregar lugar">
        <div className="grid grid-cols-3 gap-2">
          <label className="col-span-3 text-xs">Nombre
            <input className={clInput} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Museo Nacional" />
          </label>
          {geo ? (
            <>
              <label className="text-xs">Latitud
                <input className={clInput} type="number" step={0.001} min={9} max={11} value={lat} onChange={(e) => setLat(num(e.target.value, 9, 11))} />
              </label>
              <label className="text-xs">Longitud
                <input className={clInput} type="number" step={0.001} min={-86} max={-83} value={lng} onChange={(e) => setLng(num(e.target.value, -86, -83))} />
              </label>
            </>
          ) : (
            <>
              <label className="text-xs">X (0-1000)
                <input className={clInput} type="number" min={0} max={1000} value={x} onChange={(e) => setX(num(e.target.value, 0, 1000))} />
              </label>
              <label className="text-xs">Y (0-620)
                <input className={clInput} type="number" min={0} max={620} value={y} onChange={(e) => setY(num(e.target.value, 0, 620))} />
              </label>
            </>
          )}
          <div className="flex items-end"><button className={clBotonPrimario} onClick={agregarLugar}>Agregar</button></div>
        </div>
      </Seccion>

      <Seccion titulo="Agregar calle">
        <div className="grid grid-cols-2 gap-2">
          {[['Lugar 1', a, setA], ['Lugar 2', b, setB]].map(([et, val, set]) => (
            <label key={et as string} className="text-xs">{et as string}
              <select className={clInput} value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)}>
                <option value="">— elegir —</option>
                {grafo.lugares.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </label>
          ))}
          <label className="text-xs">Distancia (km)
            <input className={clInput} type="number" min={0.1} step={0.5} value={nueva.d} onChange={(e) => setNueva({ ...nueva, d: num(e.target.value, 0.1, 999) })} />
          </label>
          <label className="text-xs">Tiempo (min)
            <input className={clInput} type="number" min={1} value={nueva.t} onChange={(e) => setNueva({ ...nueva, t: num(e.target.value, 1, 999) })} />
          </label>
          <label className="text-xs">Esfuerzo (1-10)
            <input className={clInput} type="number" min={1} max={10} value={nueva.e} onChange={(e) => setNueva({ ...nueva, e: num(e.target.value, 1, 10) })} />
          </label>
          <div className="flex items-end"><button className={clBotonPrimario} onClick={agregarCalle}>Agregar calle</button></div>
        </div>
      </Seccion>

      <Seccion titulo={`Calles (${grafo.calles.length})`}>
        <div className="space-y-1">
          {grafo.calles.map((c, i) => (
            <div key={`${c.a}-${c.b}`} className="flex items-center gap-1 text-xs">
              <span className="w-16 shrink-0 font-mono">{nom(c.a)}–{nom(c.b)}</span>
              {(['d', 't', 'e'] as const).map((campo) => (
                <input
                  key={campo}
                  aria-label={`${campo === 'd' ? 'Distancia' : campo === 't' ? 'Tiempo' : 'Esfuerzo'} de ${c.a} a ${c.b}`}
                  className="w-14 rounded border border-slate-300 bg-white px-1 py-0.5 dark:border-slate-700 dark:bg-slate-900"
                  type="number"
                  min={campo === 'd' ? 0.1 : 1}
                  max={campo === 'e' ? 10 : 999}
                  step={campo === 'd' ? 0.5 : 1}
                  value={c[campo]}
                  onChange={(e) => editarCalle(i, campo, num(e.target.value, campo === 'd' ? 0.1 : 1, campo === 'e' ? 10 : 999))}
                />
              ))}
              <button className="px-1 text-red-600" aria-label={`Eliminar calle ${c.a}-${c.b}`} onClick={() => eliminarCalle(i)}>✕</button>
            </div>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-slate-500">Orden de los campos: km · min · esfuerzo.</p>
      </Seccion>

      <Seccion titulo={`Lugares (${grafo.lugares.length})`}>
        <ul className="space-y-1 text-sm">
          {grafo.lugares.map((l) => (
            <li key={l.id} className="flex items-center justify-between">
              <span><span className="mr-2 font-mono text-xs text-slate-500">{l.id}</span>{l.nombre}</span>
              <button className="px-1 text-red-600" aria-label={`Eliminar ${l.nombre}`} onClick={() => eliminarLugar(l.id)}>✕</button>
            </li>
          ))}
        </ul>
      </Seccion>
      <button className={clBoton} onClick={onRestablecer}>↺ Restablecer datos de ejemplo</button>
    </div>
  );
}
