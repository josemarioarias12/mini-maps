// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BuscadorLugar } from '../components/mapa/BuscadorLugar';
import { VistaRuta } from '../components/mapa/VistaRuta';
import { BotonVolver } from '../components/ui/BotonVolver';
import { useCalculos } from '../hooks/useCalculos';
import { useApp } from '../store/useApp';
import { CONTROLES_EQUILIBRADOS } from '../lib/controles';

/** Panel de ruta conectado al estado, como en la página del mapa. */
function PanelDePrueba() {
  const calc = useCalculos();
  return <VistaRuta calc={calc} reproduciendo={false} terminada={false} onReproducir={() => undefined} />;
}

function elegir(etiqueta: RegExp, texto: string, nombreOpcion: RegExp) {
  const campo = screen.getByLabelText(etiqueta);
  fireEvent.focus(campo);
  fireEvent.change(campo, { target: { value: texto } });
  fireEvent.click(screen.getByRole('option', { name: nombreOpcion }));
}

beforeEach(() => {
  useApp.setState({ origen: null, destino: null, controles: CONTROLES_EQUILIBRADOS, alternativa: 'personalizada', vista: 'ruta' });
});
afterEach(cleanup);

describe('Flujo origen → destino', () => {
  it('sin origen ni destino pide elegirlos', () => {
    render(<MemoryRouter><PanelDePrueba /></MemoryRouter>);
    expect(screen.getByText(/Elija un origen y un destino/i)).toBeTruthy();
  });

  it('al elegir origen y destino aparecen las alternativas de ruta', () => {
    render(<MemoryRouter><PanelDePrueba /></MemoryRouter>);
    elegir(/^Origen/i, 'Santa', /Santa Ana/i);
    elegir(/^Destino/i, 'Cartago', /Cartago/i);
    expect(useApp.getState().origen).toBe('SAN');
    expect(useApp.getState().destino).toBe('CAR');
    expect(screen.getAllByText('Personalizada').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Más rápida').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Más corta').length).toBeGreaterThan(0);
  });

  it('origen = destino muestra un aviso en lugar de una ruta', () => {
    useApp.setState({ origen: 'CAR', destino: 'CAR' });
    render(<MemoryRouter><PanelDePrueba /></MemoryRouter>);
    expect(screen.getByText(/mismo lugar/i)).toBeTruthy();
  });

  it('con todos los controles en cero avisa que los pesos no son válidos', () => {
    useApp.setState({ origen: 'SAN', destino: 'CAR', controles: { corta: 0, rapido: 0, tranquilo: 0 } });
    render(<MemoryRouter><PanelDePrueba /></MemoryRouter>);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('el buscador filtra sin importar tildes ni mayúsculas', () => {
    const lugares = useApp.getState().grafo.lugares;
    let elegido: string | null = null;
    render(<BuscadorLugar etiqueta="Origen" valor={null} lugares={lugares} onChange={(id) => (elegido = id)} />);
    const campo = screen.getByLabelText(/Origen/i);
    fireEvent.focus(campo);
    fireEvent.change(campo, { target: { value: 'belen' } });
    fireEvent.click(screen.getByRole('option', { name: /Belén/i }));
    expect(elegido).toBe('BEL');
  });
});

describe('Navegación: botones de volver', () => {
  it('«Volver» sin historial dentro de la app lleva al inicio', () => {
    render(
      <MemoryRouter initialEntries={['/guia']}>
        <Routes>
          <Route path="/" element={<p>PÁGINA DE INICIO</p>} />
          <Route path="/guia" element={<BotonVolver />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Volver/i }));
    expect(screen.getByText('PÁGINA DE INICIO')).toBeTruthy();
  });

  it('desde una vista secundaria, volver restablece la vista «ruta» en el estado', () => {
    useApp.setState({ vista: 'editor' });
    useApp.getState().setVista('ruta');
    expect(useApp.getState().vista).toBe('ruta');
  });
});

describe('Estado: deshacer y restablecer', () => {
  it('editar el grafo se puede deshacer', () => {
    const antes = useApp.getState().grafo;
    useApp.getState().editarGrafo({ ...antes, calles: antes.calles.slice(1) });
    expect(useApp.getState().grafo.calles).toHaveLength(antes.calles.length - 1);
    useApp.getState().deshacer();
    expect(useApp.getState().grafo.calles).toHaveLength(antes.calles.length);
  });

  it('eliminar el lugar elegido limpia origen/destino y restablecer los repone', () => {
    const g = useApp.getState().grafo;
    useApp.setState({ origen: 'SAN', destino: 'CAR' });
    useApp.getState().editarGrafo({ lugares: g.lugares.filter((l) => l.id !== 'SAN'), calles: g.calles.filter((c) => c.a !== 'SAN' && c.b !== 'SAN') });
    expect(useApp.getState().origen).toBeNull();
    useApp.getState().restablecer();
    expect(useApp.getState().origen).toBe('SAN');
  });
});
