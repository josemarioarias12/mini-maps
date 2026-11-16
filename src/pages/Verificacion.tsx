import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TablaMatriz } from '../components/TablaMatriz';
import { Boton } from '../components/ui/Boton';
import { BotonVolver } from '../components/ui/BotonVolver';
import { TemaBoton } from '../components/ui/TemaBoton';
import { EJ1_M2, EJ3_M3, EJ3_R, EJERCICIOS, resolverEj1, resolverEj2, resolverEj3 } from '../data/ejercicios';
import { useApp } from '../store/useApp';

const ET = ['A', 'B', 'C', 'D'];

function Insignia({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <p role="status" className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${ok ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>
      {ok ? <CheckCircle2 size={18} aria-hidden /> : <XCircle size={18} aria-hidden />} {texto}
    </p>
  );
}

function Resultado({ id }: { id: 1 | 2 | 3 }) {
  if (id === 1) {
    const r = resolverEj1();
    return (
      <>
        <Insignia ok={r.coincide} texto={r.coincide ? 'M y M² coinciden con el documento' : 'No coincide con el documento'} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TablaMatriz titulo="M (calculada)" etiquetas={ET} datos={r.M} />
          <TablaMatriz titulo="M² (calculada)" etiquetas={ET} datos={r.M2} resaltar={[0, 3]} />
        </div>
        <p className="text-xs text-slate-500">Esperada: M² = {JSON.stringify(EJ1_M2)}. La entrada (A, D) = 2: A→B→D y A→C→D.</p>
      </>
    );
  }
  if (id === 2) {
    const r = resolverEj2();
    return (
      <>
        <Insignia ok={r.coincide} texto={r.coincide ? 'Ruta más rápida A→B→C→D = 9 minutos, igual que en el documento' : 'No coincide con el documento'} />
        <TablaMatriz titulo="W (tiempos en minutos)" etiquetas={ET} datos={r.W} />
        <p className="mb-1 text-sm font-semibold">Pasos de Dijkstra desde A</p>
        <div className="overflow-x-auto">
          <table className="border-collapse font-mono text-xs">
            <thead><tr className="bg-slate-100 dark:bg-slate-800"><th className="px-2 py-1">it.</th><th className="px-2 py-1">visita</th>{ET.map((e) => <th key={e} className="px-2 py-1">{e}</th>)}</tr></thead>
            <tbody>
              {r.pasos.map((p) => (
                <tr key={p.iteracion} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-2 py-1 text-center">{p.iteracion}</td>
                  <td className="px-2 py-1 text-center font-bold">{ET[p.visitado]}</td>
                  {p.dist.map((d, j) => <td key={ET[j]} className={`px-2 py-1 text-center ${p.actualizados.includes(j) ? 'bg-amber-200 font-bold text-slate-900' : ''}`}>{Number.isFinite(d) ? d : '∞'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
  const r = resolverEj3();
  return (
    <>
      <Insignia ok={r.coincide} texto={r.coincide ? 'M³ y R coinciden con el documento' : 'No coincide con el documento'} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TablaMatriz titulo="M³ (calculada)" etiquetas={ET} datos={r.M3} />
        <TablaMatriz titulo="R = I + M + M² + M³ (calculada)" etiquetas={ET} datos={r.R} />
      </div>
      <Insignia ok={r.conexo} texto={r.conexo ? 'Todos los r_ij son mayores que 0: el grafo es conexo' : 'El grafo no es conexo'} />
      <p className="text-xs text-slate-500">Esperadas: M³ = {JSON.stringify(EJ3_M3)}; R = {JSON.stringify(EJ3_R)}.</p>
    </>
  );
}

export default function Verificacion() {
  const [activo, setActivo] = useState<number | null>(null);
  const cargar = useApp((s) => s.cargarEjemplo);
  const navegar = useNavigate();
  useEffect(() => { document.title = 'Verificación · Mini Maps'; }, []);
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <BotonVolver />
        <span className="ml-auto" />
        <TemaBoton />
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 tabIndex={-1} className="text-3xl font-black">Verificación con los ejercicios del documento</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          El programa resuelve los tres ejercicios del Avance 1 y compara su resultado con el calculado a mano. Pulse «Cargar y verificar» para ejecutarlos.
        </p>
        <div className="mt-6 space-y-5">
          {EJERCICIOS.map((ej) => (
            <article key={ej.id} className="rounded-tarjeta border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold">{ej.titulo}</h2>
              <p className="mb-3 mt-1 text-sm text-slate-600 dark:text-slate-300">{ej.descripcion}</p>
              <div className="flex flex-wrap gap-2">
                <Boton variante="primario" onClick={() => setActivo(ej.id)}>Cargar y verificar</Boton>
                {activo === ej.id && (
                  <Boton onClick={() => { cargar(ej.grafo, ej.origen, ej.destino, ej.pesos.alfa === 0 && ej.pesos.gamma === 0 ? { rapido: 100, corta: 0, tranquilo: 0 } : { rapido: 34, corta: 33, tranquilo: 33 }, `Ejercicio ${ej.id}`); navegar('/mapa'); }}>
                    Ver en el mapa (esquemático)
                  </Boton>
                )}
              </div>
              {activo === ej.id && <div className="mt-4"><Resultado id={ej.id} /></div>}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
