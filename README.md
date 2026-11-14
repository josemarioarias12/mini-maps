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
