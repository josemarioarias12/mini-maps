import type { Pesos } from './tipos';
import { normalizarPesos } from './matrices';

/** Controles en lenguaje humano (0–100 cada uno). */
export interface Controles {
  rapido: number; // "Llegar rápido"   → β (tiempo)
  corta: number; // "Ruta corta"       → α (distancia)
  tranquilo: number; // "Camino tranquilo" → γ (esfuerzo)
}

export const CONTROLES_EQUILIBRADOS: Controles = { rapido: 33, corta: 34, tranquilo: 33 };

/** Traduce los controles simples a los pesos α, β, γ (sin normalizar). */
export function controlesAPesosCrudos(c: Controles): Pesos {
  return { alfa: c.corta, beta: c.rapido, gamma: c.tranquilo };
}

/** Pesos α, β, γ normalizados (suman 1) o null si todos son 0. */
export function controlesAPesos(c: Controles): Pesos | null {
  return normalizarPesos(controlesAPesosCrudos(c));
}

/** Inverso: de pesos (cualquier escala) a controles 0–100 redondeados. */
export function pesosAControles(p: Pesos): Controles {
  const s = p.alfa + p.beta + p.gamma || 1;
  return { corta: Math.round((p.alfa / s) * 100), rapido: Math.round((p.beta / s) * 100), tranquilo: Math.round((p.gamma / s) * 100) };
}
