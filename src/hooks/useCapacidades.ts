import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/** ¿El navegador soporta WebGL? */
export function hayWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** ¿El usuario pidió reducir el movimiento? */
export function prefiereMenosMovimiento(): boolean {
  return typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
}

/** Dispositivo de baja capacidad (pocos núcleos o poca memoria). */
export function dispositivoLimitado(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2;
}

/** ¿Se puede mostrar la escena 3D? */
export function puede3D(): boolean {
  return hayWebGL() && !prefiereMenosMovimiento() && !dispositivoLimitado();
}

/** true mientras el elemento está visible en pantalla (IntersectionObserver). */
export function useEnPantalla<T extends Element>(): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/** Estado en línea / sin conexión. */
export function useEnLinea(): boolean {
  const [en, setEn] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setEn(true);
    const off = () => setEn(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return en;
}

/** true en pantallas anchas (≥ 1024 px). */
export function useEscritorio(): boolean {
  const [esc, setEsc] = useState(() => (typeof window === 'undefined' ? true : window.matchMedia?.('(min-width: 1024px)').matches ?? true));
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const fn = () => setEsc(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return esc;
}
