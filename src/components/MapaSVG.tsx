import type { Calle, Grafo } from '../lib/tipos';

interface Props {
  grafo: Grafo;
  origen: string | null;
  destino: string | null;
  ruta: string[] | null; // ids en orden
  isocrona: Map<string, number> | null; // id → tiempo
  etiquetaCalle: (c: Calle) => string;
  onSeleccionar: (id: string) => void;
}

const clave = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Mapa dibujado con SVG propio: calles, ruta animada, isócrona y marcadores. */
export function MapaSVG({ grafo, origen, destino, ruta, isocrona, etiquetaCalle, onSeleccionar }: Props) {
  const pos = new Map(grafo.lugares.map((l) => [l.id, l] as const));
  const enRuta = new Set<string>();
  if (ruta) for (let k = 0; k < ruta.length - 1; k++) enRuta.add(clave(ruta[k], ruta[k + 1]));

  return (
    <svg viewBox="0 0 1000 620" className="h-full w-full" role="group" aria-label="Mapa de lugares y calles">
      <defs>
        <pattern id="rejilla" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="var(--rejilla)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="1000" height="620" fill="var(--mapa-bg)" />
      <rect width="1000" height="620" fill="url(#rejilla)" />

      {/* Zona sombreada de la isócrona */}
      {isocrona &&
        grafo.lugares
          .filter((l) => isocrona.has(l.id))
          .map((l) => <circle key={`iso-${l.id}`} cx={l.x} cy={l.y} r={95} fill="var(--iso)" fillOpacity={0.16} />)}

      {/* Calles */}
      {grafo.calles.map((c) => {
        const A = pos.get(c.a);
        const B = pos.get(c.b);
        if (!A || !B) return null;
        const k = clave(c.a, c.b);
        const activa = enRuta.has(k);
        const isoCalle = isocrona?.has(c.a) && isocrona.has(c.b);
        return (
          <g key={k}>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={isoCalle ? 'var(--iso)' : 'var(--arista)'} strokeWidth={isoCalle ? 4 : 3} strokeLinecap="round" />
            {activa && (
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#2563eb" strokeWidth={7} strokeLinecap="round" className="ruta-animada" />
            )}
          </g>
        );
      })}

      {/* Etiquetas de peso (encima de las calles) */}
      {grafo.calles.map((c) => {
        const A = pos.get(c.a);
        const B = pos.get(c.b);
        if (!A || !B) return null;
        return (
          <text
            key={`et-${clave(c.a, c.b)}`}
            x={(A.x + B.x) / 2}
            y={(A.y + B.y) / 2 + 4}
            textAnchor="middle"
            fontSize={12}
            fontWeight={600}
            fill="var(--texto-mapa)"
            stroke="var(--mapa-bg)"
            strokeWidth={4}
            paintOrder="stroke"
          >
            {etiquetaCalle(c)}
          </text>
        );
      })}

      {/* Nodos */}
      {grafo.lugares.map((l) => {
        const esOrigen = l.id === origen;
        const esDestino = l.id === destino;
        const alcanzable = isocrona?.has(l.id) ?? false;
        const rol = esOrigen ? ', origen' : esDestino ? ', destino' : '';
        return (
          <g
            key={l.id}
            className="nodo cursor-pointer"
            tabIndex={0}
            role="button"
            aria-label={`${l.nombre}${rol}`}
            onClick={() => onSeleccionar(l.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSeleccionar(l.id);
              }
            }}
          >
            <circle className="anillo" cx={l.x} cy={l.y} r={26} fill="none" stroke="#3b82f6" strokeWidth={3} />
            {esDestino ? (
              <rect className="cuerpo" x={l.x - 16} y={l.y - 16} width={32} height={32} rx={8} fill="#dc2626" stroke="#fff" strokeWidth={3} />
            ) : (
              <circle
                className="cuerpo"
                cx={l.x}
                cy={l.y}
                r={esOrigen ? 18 : 13}
                fill={esOrigen ? '#16a34a' : alcanzable ? '#f59e0b' : 'var(--nodo)'}
                stroke="#fff"
                strokeWidth={3}
              />
            )}
            {(esOrigen || esDestino) && (
              <text x={l.x} y={l.y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="#fff" pointerEvents="none">
                {esOrigen ? 'O' : 'D'}
              </text>
            )}
            <text
              x={l.x}
              y={l.y + 38}
              textAnchor="middle"
              fontSize={14}
              fontWeight={600}
              fill="var(--texto-mapa)"
              stroke="var(--mapa-bg)"
              strokeWidth={4}
              paintOrder="stroke"
              pointerEvents="none"
            >
              {l.nombre}
              {isocrona?.has(l.id) ? ` · ${Math.round((isocrona.get(l.id) ?? 0) * 10) / 10} min` : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
