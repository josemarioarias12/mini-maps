import type { Calle, Grafo } from '../../lib/tipos';

const clave = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

interface Props {
  grafo: Grafo;
  ruta?: string[] | null; // ruta resaltada (ids)
  nodosActivos?: Set<string>; // nodos coloreados (alcanzables, visitados…)
  nodoEnfasis?: string | null; // nodo con aro (hover, origen)
  aristasApagadas?: Set<string>; // claves "A|B" dibujadas tenues
  etiquetaArista?: (c: Calle) => string | null;
  onHoverNodo?: (id: string | null) => void;
  aria: string;
  colorRuta?: string;
}

/** Dibujo SVG reutilizable de un grafo pequeño (para las demostraciones del landing). */
export function GrafoSVG({ grafo, ruta, nodosActivos, nodoEnfasis, aristasApagadas, etiquetaArista, onHoverNodo, aria, colorRuta = '#2563eb' }: Props) {
  const pos = new Map(grafo.lugares.map((l) => [l.id, l] as const));
  const enRuta = new Set<string>();
  if (ruta) for (let k = 0; k < ruta.length - 1; k++) enRuta.add(clave(ruta[k], ruta[k + 1]));
  return (
    <svg viewBox="0 0 390 240" className="h-auto w-full" role="img" aria-label={aria}>
      {grafo.calles.map((c) => {
        const A = pos.get(c.a);
        const B = pos.get(c.b);
        if (!A || !B) return null;
        const k = clave(c.a, c.b);
        const apagada = aristasApagadas?.has(k);
        const etiqueta = etiquetaArista?.(c);
        return (
          <g key={k}>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--arista)" strokeWidth={apagada ? 1.5 : 3} strokeDasharray={apagada ? '4 6' : undefined} opacity={apagada ? 0.4 : 1} strokeLinecap="round" />
            {enRuta.has(k) && <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={colorRuta} strokeWidth={6} strokeLinecap="round" className="ruta-animada" />}
            {etiqueta && !apagada && (
              <text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 - 5} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--texto-mapa)" stroke="var(--mapa-bg)" strokeWidth={3} paintOrder="stroke">
                {etiqueta}
              </text>
            )}
          </g>
        );
      })}
      {grafo.lugares.map((l) => {
        const activo = nodosActivos?.has(l.id);
        return (
          <g key={l.id} onMouseEnter={() => onHoverNodo?.(l.id)} onMouseLeave={() => onHoverNodo?.(null)} onFocus={() => onHoverNodo?.(l.id)} onBlur={() => onHoverNodo?.(null)} tabIndex={onHoverNodo ? 0 : undefined} aria-label={`Lugar ${l.id}`}>
            {nodoEnfasis === l.id && <circle cx={l.x} cy={l.y} r={25} fill="none" stroke="#3b82f6" strokeWidth={3} opacity={0.7} />}
            <circle cx={l.x} cy={l.y} r={17} fill={activo ? '#f59e0b' : 'var(--nodo)'} stroke="#fff" strokeWidth={3} style={{ transition: 'fill .3s' }} />
            <text x={l.x} y={l.y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="#fff" pointerEvents="none">{l.id}</text>
          </g>
        );
      })}
    </svg>
  );
}
