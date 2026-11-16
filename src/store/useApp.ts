import { create } from 'zustand';
import { copiarGrafo } from '../data/ejemplo';
import { DATASET, DESTINO_DEFECTO, ORIGEN_DEFECTO } from '../data/datasetActivo';
import { CONTROLES_EQUILIBRADOS } from '../lib/controles';
import type { Controles } from '../lib/controles';
import type { Enlace, Vista } from '../lib/enlaces';
import type { Grafo } from '../lib/tipos';

export type Tema = 'claro' | 'oscuro';
export type Alternativa = 'personalizada' | 'tiempo' | 'distancia' | 'esfuerzo';

export interface Toast {
  id: number;
  mensaje: string;
  accion?: { texto: string; fn: () => void };
}

interface Estado {
  grafo: Grafo;
  historial: Grafo[]; // para deshacer ediciones
  origen: string | null;
  destino: string | null;
  controles: Controles;
  alternativa: Alternativa;
  vista: Vista;
  tMax: number;
  k: number; // tramos para "¿de cuántas formas?"
  avanzado: boolean; // modo avanzado (muestra el álgebra)
  tema: Tema;
  ejemplo: string | null; // etiqueta del ejercicio cargado (mapa esquemático) o null
  tourVisto: boolean;
  tourActivo: boolean;
  toasts: Toast[];

  setOrigen: (id: string | null) => void;
  setDestino: (id: string | null) => void;
  intercambiar: () => void;
  setControles: (c: Controles) => void;
  setAlternativa: (a: Alternativa) => void;
  setVista: (v: Vista) => void;
  setTMax: (n: number) => void;
  setK: (n: number) => void;
  setAvanzado: (v: boolean) => void;
  setTema: (t: Tema) => void;
  editarGrafo: (g: Grafo) => void;
  deshacer: () => void;
  restablecer: () => void;
  cargarEjemplo: (g: Grafo, origen: string, destino: string, controles: Controles, etiqueta: string) => void;
  aplicarEnlace: (e: Enlace) => void;
  mostrarToast: (mensaje: string, accion?: Toast['accion']) => void;
  cerrarToast: (id: number) => void;
  iniciarTour: () => void;
  cerrarTour: () => void;
}

const leer = (clave: string): string | null => {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
};
const guardar = (clave: string, valor: string): void => {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    /* sin almacenamiento */
  }
};

function temaInicial(): Tema {
  const g = leer('minimaps-tema');
  if (g === 'claro' || g === 'oscuro') return g;
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

let contadorToast = 0;

export const useApp = create<Estado>()((set, get) => ({
  grafo: copiarGrafo(DATASET),
  historial: [],
  origen: ORIGEN_DEFECTO,
  destino: DESTINO_DEFECTO,
  controles: CONTROLES_EQUILIBRADOS,
  alternativa: 'personalizada',
  vista: 'ruta',
  tMax: 30,
  k: 2,
  avanzado: false,
  tema: temaInicial(),
  ejemplo: null,
  tourVisto: leer('minimaps-tour-visto') === '1',
  tourActivo: false,
  toasts: [],

  setOrigen: (origen) => set({ origen }),
  setDestino: (destino) => set({ destino }),
  intercambiar: () => set((s) => ({ origen: s.destino, destino: s.origen })),
  setControles: (controles) => set({ controles }),
  setAlternativa: (alternativa) => set({ alternativa }),
  setVista: (vista) => set({ vista }),
  setTMax: (tMax) => set({ tMax }),
  setK: (k) => set({ k }),
  setAvanzado: (avanzado) => set({ avanzado }),
  setTema: (tema) => {
    guardar('minimaps-tema', tema);
    set({ tema });
  },
  editarGrafo: (g) =>
    set((s) => ({
      grafo: g,
      historial: [...s.historial.slice(-19), s.grafo],
      origen: s.origen && g.lugares.some((l) => l.id === s.origen) ? s.origen : null,
      destino: s.destino && g.lugares.some((l) => l.id === s.destino) ? s.destino : null,
    })),
  deshacer: () => {
    const { historial } = get();
    if (historial.length === 0) return;
    set({ grafo: historial[historial.length - 1], historial: historial.slice(0, -1) });
  },
  restablecer: () =>
    set({
      grafo: copiarGrafo(DATASET),
      historial: [],
      origen: ORIGEN_DEFECTO,
      destino: DESTINO_DEFECTO,
      controles: CONTROLES_EQUILIBRADOS,
      alternativa: 'personalizada',
      vista: 'ruta',
      ejemplo: null,
    }),
  cargarEjemplo: (g, origen, destino, controles, etiqueta) =>
    set({ grafo: copiarGrafo(g), historial: [], origen, destino, controles, alternativa: 'personalizada', vista: 'ruta', ejemplo: etiqueta }),
  aplicarEnlace: (e) =>
    set((s) => ({
      origen: e.origen ?? s.origen,
      destino: e.destino ?? s.destino,
      controles: e.controles ?? s.controles,
      vista: e.vista ?? s.vista,
      tMax: e.tMax ?? s.tMax,
    })),
  mostrarToast: (mensaje, accion) => {
    const id = ++contadorToast;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, mensaje, accion }] }));
    setTimeout(() => get().cerrarToast(id), accion ? 8000 : 4000);
  },
  cerrarToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  iniciarTour: () => set({ tourActivo: true, vista: 'ruta' }),
  cerrarTour: () => {
    guardar('minimaps-tour-visto', '1');
    set({ tourActivo: false, tourVisto: true });
  },
}));
