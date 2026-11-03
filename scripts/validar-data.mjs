#!/usr/bin/env node
// VetBA — validación y corrección reproducible de data.json.
//
//   node scripts/validar-data.mjs            corrige lo que se puede sin internet
//   node scripts/validar-data.mjs --red      además recalcula barrio/partido (Buenos Aires Data + Nominatim)
//   node scripts/validar-data.mjs --check    no escribe nada, solo informa
//
// Idempotente: correrlo dos veces da el mismo resultado. Antes de escribir
// hace backup en data.backup-AAAAMMDD.json (si no existe).
//
// Qué hace:
//  1. Reclasifica `tipo` (tags OSM si el registro se cruzó con OSM; si no, palabras del nombre).
//     -> reports/reclasificados.csv
//  2. Barrio/partido por coordenadas (solo con --red): CABA por punto en polígono contra
//     sources/barrios-caba.geojson; GBA con Nominatim reverse (1 pedido/s, cache/nominatim/).
//  3. Teléfonos a E.164 (`telefono_e164`); celular explícito -> `celular`. Inválidos al reporte.
//  4. Duplicados: fusiona los seguros, lista los dudosos para revisar a mano.
//  5. Horarios: solo desde fuentes con días explícitos (OSM opening_hours). El texto de Google sin días no se toca.
// Reporte: reports/validacion.md

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerJSON, escribirData, norm, barrioDe, metros, normalizarTelefono, clasificar, sonDuplicados, fusionar, nombresParecidos, parsearOpeningHours, partidoPorLocalidad } from './lib/datos.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...x) => path.join(ROOT, ...x);
const RED = process.argv.includes('--red');
const CHECK = process.argv.includes('--check');
const UA = 'VetBA-data/1.0 (+https://www.vetba.com.ar)';
const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');

let data = leerJSON(P('data.json'));
const totalInicial = data.length;
const log = { reclas: [], fusiones: [], revisar: [], telInvalidos: [], barrio: [], partido: [], partidoRevisar: [], pendientesBarrio: 0, horariosOSM: 0, errores: [] };

/* ---------------- OSM: tags crudos si existen (sources/osm-*.json) ---------------- */
const osmElems = [];
if (existsSync(P('sources'))) for (const f of readdirSync(P('sources')).filter((f) => /^osm-.*\.json$/.test(f))) {
  try { for (const e of leerJSON(P('sources', f)).elements || []) if (e.tags) osmElems.push({ id: e.type + '/' + e.id, lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon, tags: e.tags }); }
  catch (e) { log.errores.push('No se pudo leer sources/' + f + ': ' + e.message); }
}
function osmDe(r) {
  if (r.osm_id) return osmElems.find((e) => e.id === r.osm_id) || null;
  if (typeof r.lat !== 'number') return null;
  return osmElems.find((e) => typeof e.lat === 'number' && metros(r, e) < 40 && e.tags.name && nombresParecidos(r.nombre, e.tags.name)) || null;
}

/* ---------------- 1. tipo ---------------- */
const SERV_RUBRO = { petshop: 'petshop', peluqueria: 'peluqueria' };
// Servicios que el relevamiento original asignó automáticamente a TODA veterinaria.
const AUTO_VET = ['consultas', 'vacunacion'];
for (const r of data) {
  const osm = osmDe(r);
  if (osm) { r.osm_id = r.osm_id || osm.id; r.fuente = [...new Set([...(r.fuente || []), 'osm'])]; }
  const c = clasificar(r, osm?.tags);
  const servAntes = (r.servicios || []).slice();
  let nota = '';
  if (c.tipo !== r.tipo) {
    if (r.tipo === 'veterinaria' && c.tipo !== 'veterinaria') {
      const quitados = AUTO_VET.filter((s) => (r.servicios || []).includes(s));
      if (quitados.length) { r.servicios = r.servicios.filter((s) => !AUTO_VET.includes(s)); nota = 'se quitaron ' + quitados.join('+') + ' (asignados automáticamente por ser "veterinaria")'; }
    }
    log.reclas.push({ id: r.id, nombre: r.nombre, antes: r.tipo, despues: c.tipo, regla: c.regla, nota });
    r.tipo = c.tipo;
  }
  for (const x of c.extras) if (SERV_RUBRO[x] && !(r.servicios || []).includes(SERV_RUBRO[x])) r.servicios = [...(r.servicios || []), SERV_RUBRO[x]];
  if (r.placeId) r.fuente = [...new Set(['google', ...(r.fuente || [])])];
  // 5. horarios desde OSM (días explícitos) — nunca pisa un horario cargado a mano
  if (osm?.tags?.opening_hours && !r.horarios) { const h = parsearOpeningHours(osm.tags.opening_hours); if (h) { r.horarios = h; log.horariosOSM++; } }
}

/* ---------------- 3. teléfonos ---------------- */
for (const r of data) {
  const t = normalizarTelefono(r.telefono);
  // Se asigna en el lugar (sin borrar y recrear) para que el orden de las claves no cambie entre corridas.
  if (t.valido) { r.telefono_e164 = t.e164; if (t.movil && !r.celular) r.celular = t.e164; }
  else { delete r.telefono_e164; if (r.telefono) log.telInvalidos.push({ id: r.id, nombre: r.nombre, telefono: r.telefono, motivo: t.motivo }); }
}

/* ---------------- 4. duplicados ---------------- */
for (let i = 0; i < data.length; i++) {
  for (let j = i + 1; j < data.length; j++) {
    const m = sonDuplicados(data[i], data[j]);
    if (!m) continue;
    if (!m.fusionar) { log.revisar.push({ a: data[i], b: data[j], motivo: m.motivo }); continue; }
    const { out, keep, drop } = fusionar(data[i], data[j]);
    log.fusiones.push({ queda: keep.id + ' ' + keep.nombre, sale: drop.id + ' ' + drop.nombre, motivo: m.motivo });
    data[i] = out; data.splice(j, 1); j = i; // re-evaluar contra el resto
  }
}

/* ---------------- 2. barrio / partido (requiere --red) ---------------- */
const BARRIOS_CABA = ['Agronomía', 'Almagro', 'Balvanera', 'Barracas', 'Belgrano', 'Boedo', 'Caballito', 'Chacarita', 'Coghlan', 'Colegiales', 'Constitución', 'Flores', 'Floresta', 'La Boca', 'La Paternal', 'Liniers', 'Mataderos', 'Monte Castro', 'Monserrat', 'Nueva Pompeya', 'Núñez', 'Palermo', 'Parque Avellaneda', 'Parque Chacabuco', 'Parque Chas', 'Parque Patricios', 'Puerto Madero', 'Recoleta', 'Retiro', 'Saavedra', 'San Cristóbal', 'San Nicolás', 'San Telmo', 'Vélez Sarsfield', 'Versalles', 'Villa Crespo', 'Villa del Parque', 'Villa Devoto', 'Villa General Mitre', 'Villa Lugano', 'Villa Luro', 'Villa Ortúzar', 'Villa Pueyrredón', 'Villa Real', 'Villa Riachuelo', 'Villa Santa Rita', 'Villa Soldati', 'Villa Urquiza'];
const nombreOficial = (s) => { const k = norm(s).replace(/\bgral\.?\b/, 'general').replace(/[^a-z ]/g, '').trim(); return BARRIOS_CABA.find((b) => norm(b) === k) || null; };
function enPoligono(pt, ring) { let inside = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > pt.lat) !== (yj > pt.lat) && pt.lng < ((xj - xi) * (pt.lat - yi)) / (yj - yi) + xi) inside = !inside; } return inside; }
function barrioCABA(r, gj) {
  for (const f of gj.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) if (enPoligono(r, poly[0]) && !poly.slice(1).some((h) => enPoligono(r, h))) {
      const p = f.properties || {}; return nombreOficial(p.BARRIO || p.barrio || p.nombre || p.NOMBRE || '');
    }
  }
  return null;
}
const dormir = (ms) => new Promise((res) => setTimeout(res, ms));
let ultimoPedido = 0;
async function nominatim(lat, lng) {
  const key = lat.toFixed(5) + ',' + lng.toFixed(5);
  const file = P('cache', 'nominatim', key + '.json');
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  if (!RED) return null;
  const espera = 1100 - (Date.now() - ultimoPedido); if (espera > 0) await dormir(espera);
  ultimoPedido = Date.now();
  const res = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&addressdetails=1&accept-language=es&lat=' + lat + '&lon=' + lng, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('Nominatim HTTP ' + res.status);
  const j = await res.json();
  mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(j));
  return j;
}
const limpiarPartido = (s) => String(s || '').replace(/^Partido de\s+/i, '').trim() || null;

const geoCABA = existsSync(P('sources', 'barrios-caba.geojson')) ? leerJSON(P('sources', 'barrios-caba.geojson')) : null;
if (RED && !geoCABA) log.errores.push('Falta sources/barrios-caba.geojson: corré antes `node scripts/fuentes/descargar.mjs barrios`.');
for (const r of data) {
  if (typeof r.lat !== 'number') continue;
  const antes = barrioDe(r);
  if (r.zona === 'CABA') {
    if (!geoCABA) { if (!antes) log.pendientesBarrio++; continue; }
    const b = barrioCABA(r, geoCABA);
    if (b && b !== antes) { log.barrio.push({ id: r.id, nombre: r.nombre, antes, despues: b, fuente: 'polígono BA Data' }); r.barrio = b; }
    if (!b) log.errores.push('#' + r.id + ' no cae en ningún barrio de CABA (¿zona mal cargada?)');
  } else {
    let j = null;
    try { j = await nominatim(r.lat, r.lng); } catch (e) { log.errores.push('#' + r.id + ' ' + e.message); }
    if (!j) { if (!antes || !r.partido) log.pendientesBarrio++; continue; }
    const a = j.address || {};
    const loc = a.suburb || a.city_district || a.town || a.city || a.village || null;
    const partido = limpiarPartido(a.county || a.state_district);
    if (loc && loc !== antes) { log.barrio.push({ id: r.id, nombre: r.nombre, antes, despues: loc, fuente: 'Nominatim' }); r.barrio = loc; }
    if (partido) { r.partido = partido; r.partido_fuente = 'nominatim'; delete r.partido_revisar; }
  }
}

/* ---------------- 2b. partido por localidad (sin internet) ----------------
   Para los registros de GBA que todavía no tienen partido. No pisa uno existente. */
for (const r of data) {
  if (r.zona === 'CABA') continue;
  if (r.partido) { if (r.partido_revisar) log.partidoRevisar.push({ id: r.id, nombre: r.nombre, partido: r.partido, motivo: r.partido_revisar }); continue; }
  const p = partidoPorLocalidad(barrioDe(r));
  if (!p) { log.errores.push('#' + r.id + ' ' + r.nombre + ': sin partido (localidad "' + (barrioDe(r) || '') + '" no está en la tabla)'); continue; }
  r.partido = p.partido; r.partido_fuente = 'localidad';
  if (p.revisar) { r.partido_revisar = p.revisar; log.partidoRevisar.push({ id: r.id, nombre: r.nombre, partido: p.partido, motivo: p.revisar }); }
  log.partido.push({ id: r.id, nombre: r.nombre, barrio: barrioDe(r), partido: p.partido });
}

/* ---------------- salida ---------------- */
if (data.length + log.fusiones.length !== totalInicial) throw new Error('Inconsistencia en la cantidad de registros: abortado');
const csv = (rows, cols) => [cols.join(','), ...rows.map((r) => cols.map((c) => '"' + String(r[c] ?? '').replace(/"/g, '""') + '"').join(','))].join('\n') + '\n';
const md = `# Validación de data.json

Generado por \`scripts/validar-data.mjs${RED ? ' --red' : ''}\` el ${new Date().toISOString().slice(0, 10)}.

| | |
|---|---:|
| Registros al empezar | ${totalInicial} |
| Reclasificados (tipo) en esta corrida | ${log.reclas.length} |
| Fusionados (salen) | ${log.fusiones.length} |
| Duplicados dudosos (revisar a mano) | ${log.revisar.length} |
| Teléfonos inválidos | ${log.telInvalidos.length} |
| Barrios corregidos por coordenadas | ${log.barrio.length} |
| Partido asignado por localidad (GBA) | ${log.partido.length} |
| Partido a revisar (localidad repartida) | ${log.partidoRevisar.length} |
| Barrio/partido pendiente (falta correr con --red) | ${log.pendientesBarrio} |
| Horarios tomados de OSM | ${log.horariosOSM} |
| Registros al terminar | ${data.length} |

## Reclasificados
Detalle en \`reports/reclasificados.csv\`. Cuando un registro deja de ser "veterinaria" se le quitan *consultas* y *vacunación*: el relevamiento original se los asignó a todas las veterinarias sin verificar.

## Fusiones
${log.fusiones.map((f) => '- Queda #' + f.queda + ' ← sale #' + f.sale + ' (' + f.motivo + ')').join('\n') || '- Ninguna'}

## Duplicados dudosos — NO se fusionaron, revisar a mano
${log.revisar.map((x) => '- #' + x.a.id + ' ' + x.a.nombre + ' (' + x.a.direccion + ') ↔ #' + x.b.id + ' ' + x.b.nombre + ' (' + x.b.direccion + '): ' + x.motivo).join('\n') || '- Ninguno'}

## Teléfonos inválidos (no se muestra el botón Llamar)
${log.telInvalidos.map((t) => '- #' + t.id + ' ' + t.nombre + ' — "' + t.telefono + '": ' + t.motivo).join('\n') || '- Ninguno'}

## Barrios corregidos
${log.barrio.map((b) => '- #' + b.id + ' ' + b.nombre + ': ' + (b.antes || '(vacío)') + ' → ' + b.despues + ' (' + b.fuente + ')').join('\n') || '- Ninguno' + (RED ? '' : ' (no se corrió con --red)')}

## Partido asignado por localidad
${log.partido.map((x) => '- #' + x.id + ' ' + x.nombre + ': ' + x.barrio + ' → ' + x.partido).join('\n') || '- Ninguno (ya tenían partido)'}

## Partido a revisar
${log.partidoRevisar.map((x) => '- #' + x.id + ' ' + x.nombre + ': ' + x.partido + ' (' + x.motivo + ')').join('\n') || '- Ninguno'}

## Errores / avisos
${log.errores.map((e) => '- ' + e).join('\n') || '- Ninguno'}
`;

const huboCambios = log.reclas.length || log.fusiones.length || log.barrio.length || log.partido.length || log.horariosOSM;
mkdirSync(P('reports'), { recursive: true });
if (log.reclas.length) writeFileSync(P('reports', 'reclasificados.csv'), csv(log.reclas.map((x) => ({ id: x.id, nombre: x.nombre, tipo_antes: x.antes, tipo_despues: x.despues, regla: x.regla, nota: x.nota })), ['id', 'nombre', 'tipo_antes', 'tipo_despues', 'regla', 'nota']).replace(/^\n$/, ''));
if (huboCambios || !existsSync(P('reports', 'validacion.md'))) writeFileSync(P('reports', 'validacion.md'), md);
else console.log('Sin cambios en esta corrida: se conservan los reportes anteriores.');
if (!CHECK) {
  const bk = P('data.backup-' + hoy + '.json');
  if (!existsSync(bk)) copyFileSync(P('data.json'), bk);
  escribirData(P('data.json'), data);
}
console.log(`Registros: ${totalInicial} -> ${data.length} | reclasificados ${log.reclas.length} | fusionados ${log.fusiones.length} | revisar ${log.revisar.length} | tel inválidos ${log.telInvalidos.length} | barrios corregidos ${log.barrio.length} | partido por localidad ${log.partido.length} | pendientes de --red ${log.pendientesBarrio}`);
if (log.errores.length) console.log('Avisos:\n  ' + log.errores.join('\n  '));
