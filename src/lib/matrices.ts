import type { Grafo, Matriz, Metrica, Pesos } from './tipos';

export const INF = Infinity;

/** Índice (fila/columna) de un lugar dentro de las matrices; -1 si no existe. */
export function indiceDe(g: Grafo, id: string): number {
  return g.lugares.findIndex((l) => l.id === id);
}

export function crearMatriz(n: number, valor: number): Matriz {
  return Array.from({ length: n }, () => Array<number>(n).fill(valor));
}

export function identidad(n: number): Matriz {
  const I = crearMatriz(n, 0);
  for (let i = 0; i < n; i++) I[i][i] = 1;
  return I;
}

/** Matriz de adyacencia simple M (0/1): simétrica y con diagonal en 0. */
export function matrizAdyacencia(g: Grafo): Matriz {
  const M = crearMatriz(g.lugares.length, 0);
  for (const c of g.calles) {
    const i = indiceDe(g, c.a);
    const j = indiceDe(g, c.b);
    if (i < 0 || j < 0 || i === j) continue;
    M[i][j] = 1;
    M[j][i] = 1;
  }
  return M;
}

/** Matriz ponderada (D, T o E): ∞ sin conexión directa y 0 en la diagonal. */
export function matrizPonderada(g: Grafo, campo: Metrica): Matriz {
  const n = g.lugares.length;
  const W = crearMatriz(n, INF);
  for (let i = 0; i < n; i++) W[i][i] = 0;
  for (const c of g.calles) {
    const i = indiceDe(g, c.a);
    const j = indiceDe(g, c.b);
    if (i < 0 || j < 0 || i === j) continue;
    W[i][j] = c[campo];
    W[j][i] = c[campo];
  }
  return W;
}

/** Máximo entre las entradas finitas fuera de la diagonal. */
export function maximoFinito(W: Matriz): number {
  let max = 0;
  W.forEach((fila, i) =>
    fila.forEach((v, j) => {
      if (i !== j && Number.isFinite(v) && v > max) max = v;
    }),
  );
  return max;
}

/**
 * Normaliza dividiendo entre el máximo: W' = W / max(W).
 * Es un cambio de escala puro (sin desplazamiento), por lo que NO altera cuál
 * es la ruta óptima cuando se usa un solo criterio, y deja las tres
 * magnitudes en el rango (0, 1] para poder combinarlas.
 */
export function normalizar(W: Matriz): Matriz {
  const max = maximoFinito(W);
  return W.map((fila) => fila.map((v) => (v === INF ? INF : max > 0 ? v / max : v)));
}

/** Combinación lineal C = α·D' + β·T' + γ·E' (∞ se conserva). */
export function combinacionLineal(Dn: Matriz, Tn: Matriz, En: Matriz, p: Pesos): Matriz {
  return Dn.map((fila, i) =>
    fila.map((d, j) => (Number.isFinite(d) ? p.alfa * d + p.beta * Tn[i][j] + p.gamma * En[i][j] : INF)),
  );
}

/** Ajusta los pesos para que sumen 1. Devuelve null si son inválidos. */
export function normalizarPesos(p: Pesos): Pesos | null {
  const suma = p.alfa + p.beta + p.gamma;
  if (p.alfa < 0 || p.beta < 0 || p.gamma < 0 || !(suma > 0)) return null;
  return { alfa: p.alfa / suma, beta: p.beta / suma, gamma: p.gamma / suma };
}

export function multiplicar(A: Matriz, B: Matriz): Matriz {
  const n = A.length;
  const P = crearMatriz(n, 0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += A[i][k] * B[k][j];
      P[i][j] = s;
    }
  return P;
}

export function sumar(A: Matriz, B: Matriz): Matriz {
  return A.map((fila, i) => fila.map((v, j) => v + B[i][j]));
}

/** M^k (k ≥ 0). M^0 = I. */
export function potencia(M: Matriz, k: number): Matriz {
  let P = identidad(M.length);
  for (let i = 0; i < k; i++) P = multiplicar(P, M);
  return P;
}

export function esSimetrica(M: Matriz): boolean {
  return M.every((fila, i) => fila.every((v, j) => v === M[j][i]));
}

export function diagonalEnCero(M: Matriz): boolean {
  return M.every((fila, i) => fila[i] === 0);
}

export function iguales(A: Matriz, B: Matriz): boolean {
  return A.length === B.length && A.every((fila, i) => fila.length === B[i].length && fila.every((v, j) => v === B[i][j]));
}
