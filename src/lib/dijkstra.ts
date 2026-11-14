import type { Grafo, Matriz } from './tipos';

/** Una iteración del algoritmo (para mostrar la tabla de pasos). */
export interface PasoDijkstra {
  iteracion: number;
  visitado: number; // índice del nodo que se fija en esta iteración
  dist: number[]; // distancias tentativas después de relajar
  pred: (number | null)[]; // predecesores
  actualizados: number[]; // nodos cuya distancia mejoró en esta iteración
}

export interface ResultadoDijkstra {
  dist: number[];
  pred: (number | null)[];
  pasos: PasoDijkstra[];
}

/** Dijkstra sobre una matriz de pesos W (∞ = sin arista). Complejidad O(n²). */
export function dijkstra(W: Matriz, origen: number): ResultadoDijkstra {
  const n = W.length;
  const dist = Array<number>(n).fill(Infinity);
  const pred = Array<number | null>(n).fill(null);
  const visitado = Array<boolean>(n).fill(false);
  const pasos: PasoDijkstra[] = [];
  if (origen < 0 || origen >= n) return { dist, pred, pasos };

  dist[origen] = 0;
  for (let it = 1; it <= n; it++) {
    // 1) Elegir el nodo no visitado con menor distancia finita.
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!visitado[i] && Number.isFinite(dist[i]) && (u === -1 || dist[i] < dist[u])) u = i;
    }
    if (u === -1) break; // el resto es inalcanzable
    visitado[u] = true;

    // 2) Relajar las aristas que salen de u.
    const actualizados: number[] = [];
    for (let v = 0; v < n; v++) {
      const w = W[u][v];
      if (v === u || visitado[v] || !Number.isFinite(w)) continue;
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        pred[v] = u;
        actualizados.push(v);
      }
    }
    pasos.push({ iteracion: it, visitado: u, dist: [...dist], pred: [...pred], actualizados });
  }
  return { dist, pred, pasos };
}

/** Reconstruye la ruta origen → destino siguiendo los predecesores. */
export function reconstruirRuta(pred: (number | null)[], origen: number, destino: number): number[] | null {
  if (origen === destino) return [origen];
  if (pred[destino] === null) return null;
  const ruta = [destino];
  let actual: number | null = destino;
  while (actual !== null && actual !== origen) {
    actual = pred[actual];
    if (actual !== null) ruta.push(actual);
  }
  return actual === origen ? ruta.reverse() : null;
}

export interface ResultadoRuta {
  ruta: number[] | null; // índices; null si no hay ruta
  costo: number; // ∞ si no hay ruta
  pasos: PasoDijkstra[];
}

export function rutaMinima(W: Matriz, origen: number, destino: number): ResultadoRuta {
  const r = dijkstra(W, origen);
  const costo = r.dist[destino] ?? Infinity;
  const ruta = Number.isFinite(costo) ? reconstruirRuta(r.pred, origen, destino) : null;
  return { ruta, costo, pasos: r.pasos };
}

/** Suma distancia, tiempo y esfuerzo reales de una ruta (por índices). */
export function totalesRuta(g: Grafo, ruta: number[]): { d: number; t: number; e: number } {
  let d = 0;
  let t = 0;
  let e = 0;
  for (let k = 0; k < ruta.length - 1; k++) {
    const a = g.lugares[ruta[k]].id;
    const b = g.lugares[ruta[k + 1]].id;
    const c = g.calles.find((c) => (c.a === a && c.b === b) || (c.a === b && c.b === a));
    if (c) {
      d += c.d;
      t += c.t;
      e += c.e;
    }
  }
  return { d, t, e };
}
