/** Matriz cuadrada de números (Infinity representa "sin conexión directa"). */
export type Matriz = number[][];

/** Un lugar del mapa = vértice del grafo. `id` es una sigla corta única. */
export interface Lugar {
  id: string;
  nombre: string;
  x: number; // posición en el mapa SVG (0-1000)
  y: number; // posición en el mapa SVG (0-620)
  lat?: number; // latitud real (solo con datos reales)
  lng?: number; // longitud real (solo con datos reales)
}

/** Una calle = arista NO dirigida con tres pesos. */
export interface Calle {
  a: string; // id del lugar A
  b: string; // id del lugar B
  d: number; // distancia (km)
  t: number; // tiempo (min)
  e: number; // esfuerzo (1-10): pendiente, tráfico, calidad de la vía
  ascenso?: number; // metros de subida acumulada (datos reales)
  descenso?: number; // metros de bajada acumulada (datos reales)
  corredor?: string; // nombre de la vía principal (datos reales)
  geometria?: [number, number][]; // trazado real [lng, lat] (datos reales)
}

export interface Grafo {
  lugares: Lugar[];
  calles: Calle[];
}

/** Pesos de la combinación lineal C = α·D' + β·T' + γ·E'. */
export interface Pesos {
  alfa: number;
  beta: number;
  gamma: number;
}

export type Metrica = 'd' | 't' | 'e';
