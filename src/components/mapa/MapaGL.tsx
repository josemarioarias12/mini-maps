import 'maplibre-gl/dist/maplibre-gl.css';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { GeoJSONSource, Map as MLMap, Marker, Popup, StyleSpecification } from 'maplibre-gl';
import type { Grafo, Lugar } from '../../lib/tipos';
import type { LngLat } from '../../lib/geo';
import { geometriaOrientada, interpolar, limites, trozoHasta } from '../../lib/geo';
import type { Vista } from '../../lib/enlaces';
import { prefiereMenosMovimiento } from '../../hooks/useCapacidades';

type MapLibre = typeof import('maplibre-gl');

const ESTILO_CLARO = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const ESTILO_OSCURO = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const ATRIBUCION = ['© OpenStreetMap contributors', '© CARTO', 'Open-Meteo'];

/** Plan B: teselas raster de CARTO si el estilo vectorial no carga. */
const estiloRaster = (oscuro: boolean): StyleSpecification => ({
  version: 8,
  sources: {
    base: {
      type: 'raster',
      tiles: ['a', 'b', 'c', 'd'].map((s) => `https://${s}.basemaps.cartocdn.com/rastertiles/${oscuro ? 'dark_all' : 'voyager'}/{z}/{x}/{y}.png`),
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [{ id: 'base', type: 'raster', source: 'base' }],
});

export interface MapaGLRef {
  vistaInicial: () => void;
}

interface Props {
  grafo: Grafo;
  oscuro: boolean;
  origen: string | null;
  destino: string | null;
  vista: Vista;
  ruta: LngLat[] | null;
  alternativas: LngLat[][];
  isoPoligono: LngLat[] | null;
  alcanzables: Set<string> | null;
  reproduciendo: boolean;
  ciclo: number;
  onFin: () => void;
  onElegir: (id: string, rol: 'origen' | 'destino') => void;
  relleno: { izq: number; abajo: number };
  onListo: () => void;
  onError: (mensaje: string) => void;
}

const lineaGeoJSON = (coords: LngLat[] | null) => ({
  type: 'FeatureCollection' as const,
  features: coords && coords.length > 1 ? [{ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: coords } }] : [],
});

const DURACION_MS = 9000;

/** Mapa real con MapLibre GL: calles reales, ruta animada, isócrona y marcadores. */
export const MapaGL = forwardRef<MapaGLRef, Props>(function MapaGL(props, refExterna) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<MLMap | null>(null);
  const mlRef = useRef<MapLibre | null>(null);
  const marcadores = useRef<Map<string, { marker: Marker; el: HTMLButtonElement }>>(new Map());
  const popupRef = useRef<Popup | null>(null);
  const cocheRef = useRef<Marker | null>(null);
  const progreso = useRef(0);
  const raf = useRef(0);
  const ultimo = useRef(0);
  const p = useRef(props);
  p.current = props;
  const [listo, setListo] = useState(false);
  const [estiloVersion, setEstiloVersion] = useState(0); // se incrementa cuando hay que volver a agregar capas

  const limitesTodos = (): [number, number, number, number] | null =>
    limites(p.current.grafo.lugares.filter((l) => l.lat !== undefined && l.lng !== undefined).map((l) => [l.lng as number, l.lat as number] as LngLat));

  const encuadrar = (caja: [number, number, number, number] | null, instantaneo = false) => {
    const mapa = mapaRef.current;
    if (!mapa || !caja) return;
    const { izq, abajo } = p.current.relleno;
    mapa.fitBounds([[caja[0], caja[1]], [caja[2], caja[3]]], {
      padding: { top: 90, right: 50, bottom: 50 + abajo, left: 50 + izq },
      maxZoom: 14,
      duration: instantaneo || prefiereMenosMovimiento() ? 0 : 1200,
    });
  };

  useImperativeHandle(refExterna, () => ({ vistaInicial: () => encuadrar(limitesTodos()) }));

  // ---- Crear el mapa (una vez) ----
  useEffect(() => {
    let cancelado = false;
    let rasterAplicado = false;
    (async () => {
      const mod = await import('maplibre-gl');
      if (cancelado || !contenedor.current) return;
      const ml = (mod.default ?? mod) as MapLibre;
      mlRef.current = ml;
      const mapa = new ml.Map({
        container: contenedor.current,
        style: p.current.oscuro ? ESTILO_OSCURO : ESTILO_CLARO,
        center: [-84.08, 9.93],
        zoom: 10,
        attributionControl: false,
        pitchWithRotate: true,
      });
      mapaRef.current = mapa;
      mapa.addControl(new ml.NavigationControl({ visualizePitch: true }), 'top-right');
      mapa.addControl(new ml.ScaleControl({ unit: 'metric' }), 'bottom-right');
      mapa.addControl(new ml.AttributionControl({ compact: true, customAttribution: ATRIBUCION }), 'bottom-left');
      mapa.on('style.load', () => setEstiloVersion((v) => v + 1));
      mapa.once('load', () => {
        setListo(true);
        p.current.onListo();
        encuadrar(limitesTodos(), true);
      });
      mapa.on('error', (e) => {
        const msg = String((e as { error?: Error }).error?.message ?? 'Error de mapa');
        if (!mapa.isStyleLoaded() && !rasterAplicado) {
          rasterAplicado = true; // el estilo vectorial no cargó: se prueba el plan B (raster)
          mapa.setStyle(estiloRaster(p.current.oscuro));
          return;
        }
        if (/style|tile|fetch|network|Failed/i.test(msg)) p.current.onError('No se pudieron cargar las teselas del mapa.');
      });
    })().catch(() => p.current.onError('No se pudo iniciar el mapa (WebGL no disponible).'));

    return () => {
      cancelado = true;
      cancelAnimationFrame(raf.current);
      marcadores.current.forEach((m) => m.marker.remove());
      marcadores.current.clear();
      mapaRef.current?.remove();
      mapaRef.current = null;
      setListo(false);
    };
  }, []);

  // ---- Cambio de tema: se cambia el estilo base ----
  const primerTema = useRef(true);
  useEffect(() => {
    if (primerTema.current) {
      primerTema.current = false;
      return;
    }
    mapaRef.current?.setStyle(props.oscuro ? ESTILO_OSCURO : ESTILO_CLARO);
  }, [props.oscuro]);

  // ---- Fuentes y capas (se re-crean cada vez que el estilo carga) ----
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !listo || !mapa.isStyleLoaded()) return;
    const vacio = { type: 'FeatureCollection' as const, features: [] };
    const fuentes = ['calles', 'alt', 'ruta', 'progreso', 'iso'];
    fuentes.forEach((f) => !mapa.getSource(f) && mapa.addSource(f, { type: 'geojson', data: vacio }));
    const capa = (def: Parameters<MLMap['addLayer']>[0]) => !mapa.getLayer(def.id) && mapa.addLayer(def);
    const oscuro = p.current.oscuro;
    capa({ id: 'iso-relleno', type: 'fill', source: 'iso', paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.22 } });
    capa({ id: 'iso-borde', type: 'line', source: 'iso', paint: { 'line-color': '#f59e0b', 'line-width': 2.5, 'line-dasharray': [2, 2] } });
    capa({ id: 'calles-linea', type: 'line', source: 'calles', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': oscuro ? '#64748b' : '#94a3b8', 'line-width': 3, 'line-opacity': 0.85 } });
    capa({ id: 'alt-linea', type: 'line', source: 'alt', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#64748b', 'line-width': 4, 'line-dasharray': [1.5, 2], 'line-opacity': 0.8 } });
    capa({ id: 'ruta-casing', type: 'line', source: 'ruta', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 10 } });
    capa({ id: 'ruta-base', type: 'line', source: 'ruta', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#93c5fd', 'line-width': 6 } });
    capa({ id: 'ruta-progreso', type: 'line', source: 'progreso', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#2563eb', 'line-width': 6 } });
    // Calles del grafo (trazado real) y datos actuales
    const g = p.current.grafo;
    (mapa.getSource('calles') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: g.calles.map((c) => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: geometriaOrientada(g, c, c.a) } })),
    });
    actualizarDatos();
  }, [listo, estiloVersion, props.grafo]);

  const actualizarDatos = () => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const q = p.current;
    const fijar = (id: string, data: ReturnType<typeof lineaGeoJSON> | { type: 'FeatureCollection'; features: unknown[] }) =>
      (mapa.getSource(id) as GeoJSONSource | undefined)?.setData(data as never);
    fijar('ruta', lineaGeoJSON(q.ruta));
    fijar('alt', { type: 'FeatureCollection', features: q.alternativas.filter((c) => c.length > 1).map((c) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: c } })) });
    fijar('iso', {
      type: 'FeatureCollection',
      features: q.isoPoligono ? [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[...q.isoPoligono, q.isoPoligono[0]]] } }] : [],
    });
    fijar('progreso', lineaGeoJSON(q.ruta && progreso.current > 0 ? trozoHasta(q.ruta, progreso.current) : null));
  };

  useEffect(actualizarDatos, [props.ruta, props.alternativas, props.isoPoligono, listo, estiloVersion]);

  // ---- Marcadores ----
  useEffect(() => {
    const ml = mlRef.current;
    const mapa = mapaRef.current;
    if (!ml || !mapa || !listo) return;
    const actuales = marcadores.current;
    const ids = new Set(props.grafo.lugares.map((l) => l.id));
    actuales.forEach((m, id) => {
      if (!ids.has(id)) {
        m.marker.remove();
        actuales.delete(id);
      }
    });
    props.grafo.lugares.forEach((l: Lugar, i) => {
      if (l.lat === undefined || l.lng === undefined || actuales.has(l.id)) return;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'mk';
      el.style.animationDelay = `${i * 40}ms`;
      el.setAttribute('aria-label', l.nombre);
      el.title = l.nombre;
      const etiqueta = document.createElement('span');
      etiqueta.className = 'mk-etiqueta';
      etiqueta.textContent = l.nombre.split(' – ')[0];
      el.appendChild(etiqueta);
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        abrirTarjeta(l);
      });
      const marker = new ml.Marker({ element: el }).setLngLat([l.lng, l.lat]).addTo(mapa);
      actuales.set(l.id, { marker, el });
    });
  }, [props.grafo.lugares, listo]);

  const abrirTarjeta = (l: Lugar) => {
    const ml = mlRef.current;
    const mapa = mapaRef.current;
    if (!ml || !mapa || l.lat === undefined || l.lng === undefined) return;
    popupRef.current?.remove();
    const cont = document.createElement('div');
    const titulo = document.createElement('strong');
    titulo.textContent = l.nombre;
    titulo.style.display = 'block';
    titulo.style.marginBottom = '8px';
    cont.appendChild(titulo);
    const fila = document.createElement('div');
    fila.style.display = 'flex';
    fila.style.gap = '6px';
    (['origen', 'destino'] as const).forEach((rol) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = rol === 'origen' ? 'Usar como origen' : 'Usar como destino';
      b.style.cssText = `padding:6px 10px;border-radius:10px;font:600 12px Inter,sans-serif;cursor:pointer;border:0;color:#fff;background:${rol === 'origen' ? '#16a34a' : '#dc2626'}`;
      b.addEventListener('click', () => {
        p.current.onElegir(l.id, rol);
        popupRef.current?.remove();
      });
      fila.appendChild(b);
    });
    cont.appendChild(fila);
    popupRef.current = new ml.Popup({ offset: 18, closeButton: true, maxWidth: '260px' }).setLngLat([l.lng, l.lat]).setDOMContent(cont).addTo(mapa);
  };

  // Estilo de los marcadores según origen/destino/alcanzables
  useEffect(() => {
    marcadores.current.forEach(({ el }, id) => {
      const esO = id === props.origen;
      const esD = id === props.destino && props.vista !== 'alcance';
      const alc = props.vista === 'alcance' && props.alcanzables?.has(id);
      el.className = `mk${esO ? ' origen' : ''}${esD ? ' destino' : ''}${alc && !esO ? ' alcanzable' : ''}`;
      const etiqueta = el.querySelector('.mk-etiqueta');
      el.textContent = esO ? 'O' : esD ? 'D' : '';
      if (etiqueta) el.appendChild(etiqueta);
    });
  }, [props.origen, props.destino, props.vista, props.alcanzables, props.grafo.lugares, listo]);

  // ---- Encuadre automático ----
  useEffect(() => {
    if (!listo) return;
    if (props.vista === 'alcance' && props.isoPoligono) return encuadrar(limites(props.isoPoligono));
    if (props.ruta && props.ruta.length > 1) return encuadrar(limites(props.ruta));
    const o = props.grafo.lugares.find((l) => l.id === props.origen);
    if (o?.lat !== undefined && o.lng !== undefined) {
      mapaRef.current?.flyTo({ center: [o.lng, o.lat], zoom: 12, duration: prefiereMenosMovimiento() ? 0 : 1000 });
    }
  }, [props.ruta, props.origen, props.vista, props.isoPoligono, listo]);

  // ---- Animación de la ruta: línea que se dibuja + vehículo que recorre el trayecto ----
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    progreso.current = 0;
    cocheRef.current?.remove();
    cocheRef.current = null;
    actualizarDatos();
    if (prefiereMenosMovimiento() && p.current.ruta) {
      progreso.current = 1;
      actualizarDatos();
    }
  }, [props.ciclo, props.ruta]);

  useEffect(() => {
    const ml = mlRef.current;
    const mapa = mapaRef.current;
    const ruta = props.ruta;
    if (!props.reproduciendo || !ml || !mapa || !ruta || ruta.length < 2 || !listo || prefiereMenosMovimiento()) return;
    if (!cocheRef.current) {
      const el = document.createElement('div');
      el.className = 'mk-coche';
      cocheRef.current = new ml.Marker({ element: el }).setLngLat(ruta[0]).addTo(mapa);
    }
    ultimo.current = performance.now();
    const paso = (t: number) => {
      progreso.current = Math.min(1, progreso.current + (t - ultimo.current) / DURACION_MS);
      ultimo.current = t;
      (mapa.getSource('progreso') as GeoJSONSource | undefined)?.setData(lineaGeoJSON(trozoHasta(ruta, progreso.current)) as never);
      cocheRef.current?.setLngLat(interpolar(ruta, progreso.current));
      if (progreso.current < 1) raf.current = requestAnimationFrame(paso);
      else p.current.onFin();
    };
    raf.current = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf.current);
  }, [props.reproduciendo, props.ruta, props.ciclo, listo]);

  return <div ref={contenedor} className="absolute inset-0" role="application" aria-label="Mapa interactivo" />;
});
