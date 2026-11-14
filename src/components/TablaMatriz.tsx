import type { Matriz } from '../lib/tipos';

interface Props {
  etiquetas: string[];
  datos: Matriz;
  decimales?: number;
  titulo?: string;
  resaltar?: [number, number] | null;
}

/** Formatea un valor: ∞ para Infinity, enteros sin decimales. */
export function formato(v: number, decimales: number): string {
  if (v === Infinity) return '∞';
  return Number.isInteger(v) && decimales === 0 ? String(v) : v.toFixed(decimales);
}

/** Tabla compacta para mostrar una matriz con etiquetas de filas y columnas. */
export function TablaMatriz({ etiquetas, datos, decimales = 0, titulo, resaltar }: Props) {
  return (
    <div className="mb-4">
      {titulo && <p className="mb-1 text-sm font-semibold">{titulo}</p>}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="border-collapse font-mono text-[11px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th scope="col" className="px-1.5 py-1" />
              {etiquetas.map((e) => (
                <th key={e} scope="col" className="px-1.5 py-1 text-slate-600 dark:text-slate-300">
                  {e}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datos.map((fila, i) => (
              <tr key={etiquetas[i]} className="border-t border-slate-100 dark:border-slate-800">
                <th scope="row" className="bg-slate-100 px-1.5 py-1 text-left text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {etiquetas[i]}
                </th>
                {fila.map((v, j) => {
                  const marcado = resaltar && resaltar[0] === i && resaltar[1] === j;
                  return (
                    <td
                      key={etiquetas[j]}
                      className={`px-1.5 py-1 text-center ${marcado ? 'bg-amber-200 font-bold text-slate-900' : ''} ${
                        v === Infinity ? 'text-slate-400' : v === 0 ? 'text-slate-400' : ''
                      }`}
                    >
                      {formato(v, decimales)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
