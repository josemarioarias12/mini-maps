# 🗺️ Mini Maps · Álgebra Lineal (CENFOTEC)

Mini Google Maps basado en **grafos y matrices de adyacencia**. Aplicación 100 % frontend (sin backend ni API keys).

## Qué hace
- Modela lugares como vértices y calles como aristas (grafo no dirigido).
- Matriz de adyacencia **M**, matrices ponderadas **D** (km), **T** (min) y **E** (esfuerzo 1-10).
- Matriz de costos como **combinación lineal**: `C = α·D′ + β·T′ + γ·E′` (α+β+γ = 1, `X′ = X / máx(X)`).
- Ruta de menor costo con **Dijkstra** (con tabla de iteraciones) y comparador de rutas.
- **Isócronas**: lugares alcanzables dentro de un tiempo máximo.
- **Potencias Mᵏ** (k = 1…6), conteo/listado de recorridos y **matriz de accesibilidad** `R = I + M + … + Mⁿ⁻¹`.
- Pestaña «Ejemplos del documento» que verifica los 3 ejercicios del Avance 1.
- Editor de grafo (agregar/eliminar lugares y calles, editar D, T, E).

## Estructura
```
src/lib/        lógica matemática en TypeScript puro (matrices, dijkstra, isocronas, accesibilidad, modelo)
src/components/ interfaz React (mapa SVG, pestañas)
src/data/       dataset de Costa Rica y ejercicios del documento
src/tests/      pruebas con Vitest
```

## Ejecutar en local
```bash
npm install
npm run dev      # http://localhost:5173
npm test         # pruebas unitarias
npm run build    # compilación de producción (carpeta dist)
```

## Desplegar gratis en Vercel
1. Subir el proyecto a GitHub (`git init`, `git add .`, `git commit -m "Mini Maps"`, crear repo y `git push`).
2. En https://vercel.com: **Add New → Project → importar el repositorio**.
3. Vercel detecta Vite automáticamente (Build: `npm run build`, Output: `dist`). Pulsar **Deploy**.
4. El link `https://<proyecto>.vercel.app` es el que se entrega al profesor. Cada `git push` lo actualiza.

> Los valores de distancia, tiempo y esfuerzo del mapa de Costa Rica son ilustrativos.

---

## Datos reales (Fase 1)

Por defecto la app usa un dataset **ilustrativo**. Para usar calles reales de Costa Rica:

```bash
npm run datos          # descarga y genera src/data/real.json (≈ 3-5 minutos)
npm run dev            # la app detecta el archivo y lo usa automáticamente
```

- `scripts/lugares.json` es la entrada editable: lugares (lat/lng), calles entre vecinos y un factor de congestión estimado (1.0–1.6).
- `scripts/generar-datos.mjs` consulta **OSRM** (distancia, tiempo y trazado de cada calle) y **Open-Meteo** (altitud cada ~200 m). Pausa de 1.1 s entre llamadas, reintentos con backoff y caché en `scripts/cache/`.
- `npm run datos:offline` solo usa la caché. `npm run datos -- --salida otro.json` cambia el destino.
- Al final valida: ids únicos, grafo conexo y disperso, distancia ≥ línea recta, esfuerzo entero en [1, 10]. Si algo falla, no escribe el archivo.
- Después de generarlo, **suba `src/data/real.json` a GitHub** para que Vercel lo use (no necesita internet ni llaves).

### Qué es real y qué es estimado
| Dato | Origen |
|---|---|
| Distancia (km) y trazado de la calle | Real (OpenStreetMap vía OSRM) |
| Tiempo (min) | Real **sin tráfico** (velocidades libres de OSRM) |
| Ascenso / descenso | Real, de un modelo de elevación de ~90 m de resolución (Open-Meteo) |
| Esfuerzo E (1–10) | **Estimación** con fórmula propia |
| Congestión por corredor | **Estimación** manual (solo afecta a E) |
| Coordenadas de los lugares | Aproximadas: corríjalas en `lugares.json` |

**Fórmula del esfuerzo:** `E = round(clamp(1 + Ep + Es + Ec, 1, 10))`
- `Ep = 4·min(g/6, 1)`, con `g = (ascenso + descenso) / distancia · 100`
- `Es = 2·min((sin − 1)/0.6, 1)`, con `sin = distancia de ruta / distancia en línea recta`
- `Ec = 3·min((c − 1)/0.6, 1)`, con `c` = congestión del corredor

Atribuciones: © OpenStreetMap contributors · Open-Meteo.

---

## Aplicación completa (landing + mapa + guía)

| Ruta | Contenido |
|---|---|
| `/` | Landing con escena 3D, explicación del álgebra lineal y 7 demostraciones interactivas |
| `/mapa` | El mapa (MapLibre GL + OpenStreetMap/CARTO) con rutas, alternativas, isócronas, conexiones y editor |
| `/guia` | Cómo se usa, atajos de teclado y preguntas frecuentes |
| `/verificacion` | Los 3 ejercicios del Avance 1 resueltos por el programa y comparados con el documento |

- **Botones de volver:** «← Inicio» en el mapa, «← Volver» en guía, verificación y 404 (con respaldo al inicio) y «← Volver» dentro del panel del mapa. `Esc` cierra la vista secundaria.
- **Enlaces profundos:** `/mapa?o=CEN&d=CAR&a=40&b=40&g=20&v=alcance&t=30` → origen, destino, pesos (a = ruta corta/α, b = llegar rápido/β, g = camino tranquilo/γ), vista y tiempo de la isócrona.
- **Sin WebGL, con movimiento reducido o en equipos limitados:** el hero usa un grafo 2D y el mapa cae al modo esquemático (SVG).
- **Rendimiento:** `three` y `maplibre-gl` están en chunks propios y se cargan solo en la página que los usa.
- **Cálculo:** todo en `src/lib` (TypeScript puro). Ninguna API externa calcula rutas: el Dijkstra y la combinación lineal C = α·D′ + β·T′ + γ·E′ son propios. OSRM/Open-Meteo solo se usaron una vez para generar `real.json`.
- **Pruebas:** `npm test` (67 pruebas, 2 de ellas dependen de que exista `real.json`: ejercicios del documento, modelo, datos, geometría, enlaces, flujo origen→destino, navegación y renderizado de todas las páginas).

### Decisiones técnicas
- Normalización `X′ = X / máx X` (escala pura) en lugar de min-max, para que con un solo criterio la ruta sea exactamente la óptima de ese criterio.
- Estado global con zustand; páginas con `React.lazy`; animaciones con Framer Motion respetando `prefers-reduced-motion`.
- `vercel.json` reescribe todas las rutas a `index.html` para que recargar `/mapa` o `/guia` funcione.
