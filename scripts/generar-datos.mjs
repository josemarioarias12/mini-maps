#!/usr/bin/env node
/**
 * Genera src/data/real.json con datos reales de calles de Costa Rica.
 *
 * Fuentes (gratuitas, sin llave):
 *  - OSRM (router.project-osrm.org): distancia, duración y trazado de cada calle (perfil "driving").
 *    La duración es SIN tráfico en tiempo real.
 *  - Open-Meteo Elevation: altitud a lo largo del trazado (modelo digital de ~90 m de resolución).
 * El esfuerzo E es una ESTIMACIÓN (ver calcularEsfuerzo en lib-datos.mjs).
 *
 * Uso:   npm run datos                      (descarga y genera)
 *        npm run datos -- --offline         (solo usa la caché de scripts/cache)
 *        npm run datos -- --salida ruta.json
 * Variables: OSRM_URL, ELEVATION_URL, DELAY_MS (pausa entre llamadas, por defecto 1100), CACHE_DIR
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calcularEsfuerzo, haversineM, perfilAltimetrico, remuestrear, simplificar, validar } from './lib-datos.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const OFFLINE = args.includes('--offline');
const iSalida = args.indexOf('--salida');
const SALIDA = iSalida >= 0 ? resolve(args[iSalida + 1]) : resolve(AQUI, '../src/data/real.json');
const OSRM = process.env.OSRM_URL ?? 'https://router.project-osrm.org';
const ELEVACION = process.env.ELEVATION_URL ?? 'https://api.open-meteo.com/v1/elevation';
const PAUSA_MS = Number(process.env.DELAY_MS ?? 1100); // pausa entre llamadas a OSRM
const PAUSA_ELEV_MS = Number(process.env.ELEV_DELAY_MS ?? 4000); // Open-Meteo limita por minuto: ir más despacio
const ESPERA_429_S = Number(process.env.RATE_LIMIT_WAIT_S ?? 65); // al recibir 429 se espera a que reinicie la ventana de 1 min
const CACHE = process.env.CACHE_DIR ? resolve(process.env.CACHE_DIR) : resolve(AQUI, 'cache');
const REINTENTOS = 6;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
let ultimaLlamada = 0;

/** GET JSON con caché en disco, pausa entre llamadas y reintentos con backoff exponencial. */
async function pedirJSON(url, pausaMs = PAUSA_MS) {
  const archivo = resolve(CACHE, `${createHash('sha1').update(url).digest('hex')}.json`);
  try {
    return JSON.parse(await readFile(archivo, 'utf8'));
  } catch {
    /* no está en caché */
  }
  if (OFFLINE) throw new Error(`Modo --offline: falta en caché → ${url}`);

  let ultimoError;
  for (let intento = 0; intento < REINTENTOS; intento++) {
    const espera = ultimaLlamada + pausaMs - Date.now();
    if (espera > 0) await dormir(espera);
    ultimaLlamada = Date.now();
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': 'MiniMaps-AlgebraLineal-CENFOTEC/1.0 (proyecto universitario)' } });
      if (resp.status === 429) {
        // Límite de uso: se respeta Retry-After y, si no viene, se espera ~1 minuto.
        const retry = Number(resp.headers.get('retry-after'));
        const seg = Number.isFinite(retry) && retry > 0 ? Math.max(retry, 5) : ESPERA_429_S;
        console.warn(`   ⏳ límite de uso del servidor (429): esperando ${seg} s (intento ${intento + 1}/${REINTENTOS})`);
        await dormir(seg * 1000);
        ultimoError = new Error('HTTP 429');
        continue;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const datos = await resp.json();
      await mkdir(CACHE, { recursive: true });
      await writeFile(archivo, JSON.stringify(datos));
      return datos;
    } catch (e) {
      ultimoError = e;
      const backoff = Math.min(1500 * 2 ** intento, 30000);
      console.warn(`   ⚠ intento ${intento + 1}/${REINTENTOS} falló (${e.message}); reintentando en ${backoff / 1000} s`);
      await dormir(backoff);
    }
  }
  throw new Error(`No se pudo obtener ${url}: ${ultimoError?.message}`);
}

/** Ruta real entre dos lugares con OSRM. */
async function consultarRuta(A, B) {
  const url = `${OSRM}/route/v1/driving/${A.lng},${A.lat};${B.lng},${B.lat}?overview=full&geometries=geojson&steps=false`;
  const r = await pedirJSON(url);
  if (r.code !== 'Ok' || !r.routes?.[0]) throw new Error(`OSRM no encontró ruta ${A.id}–${B.id} (${r.code})`);
  const ruta = r.routes[0];
  return { distanciaM: ruta.distance, duracionS: ruta.duration, coords: ruta.geometry.coordinates };
}

/** Altitudes (m) de una lista de puntos [lng, lat], en lotes de máximo 100. */
async function consultarAltitudes(puntos) {
  const alturas = [];
  for (let i = 0; i < puntos.length; i += 100) {
    const lote = puntos.slice(i, i + 100);
    const lat = lote.map((p) => p[1].toFixed(5)).join(',');
    const lng = lote.map((p) => p[0].toFixed(5)).join(',');
    const r = await pedirJSON(`${ELEVACION}?latitude=${lat}&longitude=${lng}`, PAUSA_ELEV_MS);
    if (!Array.isArray(r.elevation) || r.elevation.length !== lote.length) throw new Error('Respuesta de elevación inválida');
    alturas.push(...r.elevation);
  }
  return alturas;
}

async function main() {
  const config = JSON.parse(await readFile(resolve(AQUI, 'lugares.json'), 'utf8'));
  const porId = new Map(config.lugares.map((l) => [l.id, l]));
  const calles = [];
  console.log(`▶ ${config.lugares.length} lugares, ${config.calles.length} calles${OFFLINE ? ' (modo offline)' : ''}\n`);

  for (const [i, c] of config.calles.entries()) {
    const A = porId.get(c.a);
    const B = porId.get(c.b);
    if (!A || !B) throw new Error(`Calle ${c.a}–${c.b}: lugar inexistente en lugares.json`);
    const ruta = await consultarRuta(A, B);
    const muestras = remuestrear(ruta.coords, 200);
    const alturas = await consultarAltitudes(muestras);
    const { ascenso, descenso } = perfilAltimetrico(alturas);
    const lineaRectaM = haversineM([A.lng, A.lat], [B.lng, B.lat]);
    const esf = calcularEsfuerzo({ ascenso, descenso, distanciaM: ruta.distanciaM, lineaRectaM, congestion: c.congestion });

    calles.push({
      a: c.a,
      b: c.b,
      corredor: c.corredor,
      d: Math.round(ruta.distanciaM / 10) / 100, // km, 2 decimales
      t: Math.max(0.1, Math.round((ruta.duracionS / 60) * 10) / 10), // min, 1 decimal
      e: esf.valor,
      ascenso: Math.round(ascenso),
      descenso: Math.round(descenso),
      geometria: simplificar(ruta.coords, 60).map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]),
    });
    const ult = calles[calles.length - 1];
    console.log(`[${String(i + 1).padStart(2)}/${config.calles.length}] ${c.a}–${c.b}  ${ult.d} km · ${ult.t} min · ↑${ult.ascenso} m ↓${ult.descenso} m · E=${ult.e}`);
  }

  const lugares = config.lugares.map(({ id, nombre, lat, lng }) => ({ id, nombre, lat, lng }));
  const errores = validar({ lugares, calles });
  if (errores.length) {
    console.error('\n✖ Validación fallida:\n' + errores.map((e) => '  - ' + e).join('\n'));
    process.exit(1);
  }

  const salida = {
    meta: {
      generado: new Date().toISOString(),
      fuentes: ['© OpenStreetMap contributors (OSRM, perfil driving)', 'Open-Meteo (elevación)'],
      avisos: [
        'Los tiempos son SIN tráfico en tiempo real.',
        'El esfuerzo E es una ESTIMACIÓN: pendiente + sinuosidad + factor de congestión asignado a mano.',
        'Las coordenadas de los lugares son aproximadas.',
      ],
      formulaE: 'E = round(clamp(1 + 4·min(g/6,1) + 2·min((sin−1)/0.6,1) + 3·min((c−1)/0.6,1), 1, 10))',
    },
    lugares,
    calles,
  };
  await mkdir(dirname(SALIDA), { recursive: true });
  await writeFile(SALIDA, JSON.stringify(salida));
  console.log(`\n✔ Validación correcta. Archivo generado: ${SALIDA}`);
}

main().catch((e) => {
  console.error('\n✖ ' + e.message);
  process.exit(1);
});
