import type { Matriz } from './tipos';
import { identidad, multiplicar, sumar } from './matrices';

/** R = I + M + M² + ... + M^(n-1). r_ij > 0 ⇔ existe algún recorrido de i a j. */
export function accesibilidad(M: Matriz): Matriz {
  const n = M.length;
  let R = identidad(n);
  let P = identidad(n);
  for (let k = 1; k <= n - 1; k++) {
    P = multiplicar(P, M);
    R = sumar(R, P);
  }
  return R;
}

/** El grafo es conexo si todas las entradas de R son positivas. */
export function esConexo(R: Matriz): boolean {
  return R.every((fila) => fila.every((v) => v > 0));
}

/** Lugares sin ninguna calle (grado 0). */
export function lugaresAislados(M: Matriz): number[] {
  return M.map((fila, i) => ({ i, grado: fila.reduce((s, v) => s + v, 0) })).filter((x) => x.grado === 0).map((x) => x.i);
}

/** Componentes conexas a partir de R (grupos de lugares mutuamente accesibles). */
export function componentes(R: Matriz): number[][] {
  const visto = new Set<number>();
  const grupos: number[][] = [];
  R.forEach((fila, i) => {
    if (visto.has(i)) return;
    const grupo = fila.map((v, j) => (v > 0 ? j : -1)).filter((j) => j >= 0);
    grupo.forEach((j) => visto.add(j));
    grupos.push(grupo);
  });
  return grupos;
}

/** Lista todos los recorridos de EXACTAMENTE k tramos de i a j (se permiten repeticiones). */
export function recorridos(M: Matriz, i: number, j: number, k: number): number[][] {
  if (k === 0) return i === j ? [[i]] : [];
  const resultado: number[][] = [];
  const explorar = (actual: number, camino: number[]): void => {
    if (camino.length === k + 1) {
      if (actual === j) resultado.push(camino);
      return;
    }
    M[actual].forEach((v, siguiente) => {
      if (v > 0) explorar(siguiente, [...camino, siguiente]);
    });
  };
  explorar(i, [i]);
  return resultado;
}
