import type { Grafo, Pesos } from '../lib/tipos';
import type { Modelo } from '../lib/modelo';
import { TablaMatriz } from './TablaMatriz';
import { Aviso } from './ui/basicos';

export function TabMatrices({ grafo, modelo, pesos }: { grafo: Grafo; modelo: Modelo; pesos: Pesos | null }) {
  const et = grafo.lugares.map((l) => l.id);
  const p = pesos ?? { alfa: 1 / 3, beta: 1 / 3, gamma: 1 / 3 };
  return (
    <div>
      {!pesos && <Aviso tipo="error">Pesos inválidos: se muestran valores iguales (⅓ cada uno).</Aviso>}
      <div className="mb-4 rounded-lg bg-slate-100 p-3 font-mono text-xs dark:bg-slate-800">
        C = α·D′ + β·T′ + γ·E′
        <br />
        C = {p.alfa.toFixed(2)}·D′ + {p.beta.toFixed(2)}·T′ + {p.gamma.toFixed(2)}·E′
        <br />
        <span className="text-slate-500">donde X′ = X / máx(X) y α + β + γ = 1</span>
      </div>
      <TablaMatriz titulo="M: adyacencia (0/1)" etiquetas={et} datos={modelo.M} />
      <TablaMatriz titulo="D: distancia (km)" etiquetas={et} datos={modelo.D} decimales={1} />
      <TablaMatriz titulo="T: tiempo (min)" etiquetas={et} datos={modelo.T} />
      <TablaMatriz titulo="E: esfuerzo (1-10)" etiquetas={et} datos={modelo.E} />
      <TablaMatriz titulo="D′: distancia normalizada" etiquetas={et} datos={modelo.Dn} decimales={2} />
      <TablaMatriz titulo="T′: tiempo normalizado" etiquetas={et} datos={modelo.Tn} decimales={2} />
      <TablaMatriz titulo="E′: esfuerzo normalizado" etiquetas={et} datos={modelo.En} decimales={2} />
      <TablaMatriz titulo="C: matriz de costos (combinación lineal)" etiquetas={et} datos={modelo.C} decimales={2} />
      <p className="text-xs text-slate-500">∞ indica que no hay calle directa; la diagonal es 0.</p>
    </div>
  );
}
