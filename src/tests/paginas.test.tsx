// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Guia from '../pages/Guia';
import Landing from '../pages/Landing';
import MapaPage from '../pages/MapaPage';
import NoEncontrado from '../pages/NoEncontrado';
import Verificacion from '../pages/Verificacion';
import { useApp } from '../store/useApp';

beforeAll(() => {
  // jsdom no trae estas APIs del navegador.
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('min-width'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  window.scrollTo = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
  HTMLCanvasElement.prototype.getContext = (() => null) as never; // sin WebGL → mapa esquemático y hero 2D
});
afterEach(cleanup);

const montar = (ruta: string, el: JSX.Element) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/" element={<p>INICIO</p>} />
        <Route path={ruta.split('?')[0]} element={el} />
      </Routes>
    </MemoryRouter>,
  );

describe('Las páginas se muestran sin errores', () => {
  it('Landing: hero, secciones, 7 conceptos y enlaces al mapa', () => {
    montar('/landing', <Landing />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/álgebra lineal/i);
    expect(screen.getAllByRole('link', { name: /Abrir el mapa/i }).length).toBeGreaterThan(0);
    for (const t of ['Grafos y matriz de adyacencia', 'Potencias de la matriz', 'Matrices ponderadas', 'Combinación lineal', 'Dijkstra paso a paso', 'Accesibilidad y conexidad', 'Isócronas']) {
      expect(screen.getByText(new RegExp(t, 'i'))).toBeTruthy();
    }
    expect(screen.getAllByRole('link', { name: /Verlo en el mapa/i })).toHaveLength(7);
  });

  it('Guía: pasos, atajos y preguntas frecuentes, con botón Volver', () => {
    montar('/guia', <Guia />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Cómo usar/i);
    expect(screen.getByRole('button', { name: /Volver/i })).toBeTruthy();
    expect(screen.getAllByText(/sin tráfico/i).length).toBeGreaterThan(0);
  });

  it('Verificación: los tres ejercicios coinciden con el documento', () => {
    montar('/verificacion', <Verificacion />);
    const botones = screen.getAllByRole('button', { name: /Cargar y verificar/i });
    expect(botones).toHaveLength(3);
    botones.forEach((b) => fireEvent.click(b));
    expect(screen.getAllByText(/coincide|coinciden|✓/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/No coincide/i)).toBeNull();
  });

  it('404: ofrece volver, ir al inicio y abrir el mapa', () => {
    montar('/nada', <NoEncontrado />);
    expect(screen.getByText('404')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Ir al inicio/i })).toBeTruthy();
  });

  it('Mapa (modo esquemático): botón «Inicio», panel, ruta y enlace profundo', () => {
    useApp.setState({ vista: 'ruta', tourVisto: true, tourActivo: false });
    montar('/mapa?o=CEN&d=CAR&a=70&b=20&g=10', <MapaPage />);
    expect(screen.getByRole('link', { name: /Volver al inicio/i })).toBeTruthy();
    expect(useApp.getState().origen).toBe('CEN');
    expect(useApp.getState().destino).toBe('CAR');
    expect(useApp.getState().controles).toEqual({ corta: 70, rapido: 20, tranquilo: 10 });
    expect(screen.getAllByText('Personalizada').length).toBeGreaterThan(0);
  });

  it('Mapa: Esc vuelve a la ruta desde una vista secundaria', () => {
    useApp.setState({ vista: 'editor', tourVisto: true, tourActivo: false });
    montar('/mapa', <MapaPage />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useApp.getState().vista).toBe('ruta');
  });
});
