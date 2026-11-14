import { useState } from 'react';
import type { Grafo, Pesos } from '../lib/tipos';
import { EJERCICIOS, EJ1_M2, EJ3_M3, EJ3_R, resolverEj1, resolverEj2, resolverEj3 } from '../data/ejercicios';
import { TablaMatriz } from './TablaMatriz';
import { Aviso, clBotonPrimario } from './ui';

interface Props {
  onCargar: (g: Grafo, origen: string, destino: string, pesos: Pesos) => void;
}

const ET = ['A', 'B', 'C', 'D'];

function Resultado({ id }: { id: 1 | 2 | 3 }) {
  if (id === 1) {
    const r = resolverEj1();
    return (
      <>
        <Aviso tipo={r.coincide ? 'ok' : 'error'}>{r.coincide ? '✓ M y M² coinciden con el documento.' : '✗ No coincide con el documento.'}</Aviso>
        <TablaMatriz titulo="M (calculada)" etiquetas={ET} datos={r.M} />
        <TablaMatriz titulo="M² (calculada)" etiquetas={ET} datos={r.M2} resaltar={[0, 3]} />
        <p className="text-xs text-slate-500">Esperada: M² = {JSON.stringify(EJ1_M2)}. La entrada (A, D) = 2 → A→B→D y A→C→D.</p>
      </>
    );
  }
  if (id === 2) {
    const r = resolverEj2();
    return (
      <>
        <Aviso tipo={r.coincide ? 'ok' : 'error'}>
          {r.coincide ? '✓ Ruta más rápida A→B→C→D = 9 minutos, igual que en el documento.' : '✗ No coincide con el documento.'}
        </Aviso>
        <TablaMatriz titulo="W (tiempos, min)" etiquetas={ET} datos={r.W} />
        <p className="mb-1 text-sm font-semibold">Pasos de Dijkstra desde A</p>
        <table className="mb-2 border-collapse font-mono text-[11px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="px-2 py-1">it.</th>
              <th className="px-2 py-1">visitado</th>
              {ET.map((e) => <th key={e} className="px-2 py-1">{e}</th>)}
            </tr>
          </thead>
          <tbody>
            {r.pasos.map((p) => (
              <tr key={p.iteracion} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-2 py-1 text-center">{p.iteracion}</td>
                <td className="px-2 py-1 text-center font-bold">{ET[p.visitado]}</td>
                {p.dist.map((d, j) => (
                  <td key={ET[j]} className={`px-2 py-1 text-center ${p.actualizados.includes(j) ? 'bg-amber-200 font-bold text-slate-900' : ''}`}>
                    {Number.isFinite(d) ? d : '∞'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }
  const r = resolverEj3();
  return (
    <>
      <Aviso tipo={r.coincide ? 'ok' : 'error'}>{r.coincide ? '✓ M³ y R coinciden con el documento.' : '✗ No coincide con el documento.'}</Aviso>
      <TablaMatriz titulo="M³ (calculada)" etiquetas={ET} datos={r.M3} />
      <TablaMatriz titulo="R = I + M + M² + M³ (calculada)" etiquetas={ET} datos={r.R} />
      <Aviso tipo={r.conexo ? 'ok' : 'error'}>{r.conexo ? 'Conclusión: todos los r_ij > 0 → el grafo es conexo.' : 'El grafo no es conexo.'}</Aviso>
      <p className="text-xs text-slate-500">Esperadas: M³ = {JSON.stringify(EJ3_M3)}; R = {JSON.stringify(EJ3_R)}.</p>
    </>
  );
}

export function TabEjemplos({ onCargar }: Props) {
  const [activo, setActivo] = useState<1 | 2 | 3 | null>(null);
  return (
    <div>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
        Estos son los tres ejercicios resueltos a mano en el Avance 1. El botón carga el grafo en el mapa y vuelve a calcular todo con el programa
        para comprobar que los resultados coinciden.
      </p>
      {EJERCICIOS.map((ej) => (
        <article key={ej.id} className="mb-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <h3 className="text-sm font-semibold">{ej.titulo}</h3>
          <p className="mb-2 mt-1 text-xs text-slate-500">{ej.descripcion}</p>
          <button
            className={clBotonPrimario}
            onClick={() => {
              onCargar(ej.grafo, ej.origen, ej.destino, ej.pesos);
              setActivo(ej.id);
            }}
          >
            Cargar y verificar
          </button>
          {activo === ej.id && (
            <div className="mt-3">
              <Resultado id={ej.id} />
            </div>
          )}
        </article>
      ))}
      <p className="text-xs text-slate-500">Para volver al mapa de Costa Rica use «Restablecer datos de ejemplo» en la pestaña Editor.</p>
    </div>
  );
}
