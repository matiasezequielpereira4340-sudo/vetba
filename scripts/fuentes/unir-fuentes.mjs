#!/usr/bin/env node
// VetBA — une sources/osm-*.json y sources/apify-*.json con data.json.
//
//   node scripts/fuentes/unir-fuentes.mjs           agrega/completa registros
//   node scripts/fuentes/unir-fuentes.mjs --check   solo informa
//
// Reglas:
//  - Dedupe con la misma regla que validar-data (lib/datos.mjs#sonDuplicados).
//    Si un candidato coincide con un registro existente, solo COMPLETA campos vacíos.
//  - Se excluyen los lugares cerrados permanentemente (Google).
//  - zona según lib/datos.mjs#ZONAS_PARTIDO; partido = el de la descarga.
//  - fuente: ["google"], ["osm"] o ambos.
//  - No se inventa nada: un campo que la fuente no trae queda vacío
//    (por ejemplo, a los nuevos NO se les agregan "consultas"/"vacunación").
// Reporte: reports/fuentes.md
import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerJSON, escribirData, sonDuplicados, clasificar, parsearOpeningHours, parsearHorarioGoogle, normalizarTelefono, ZONAS_PARTIDO, norm, PARTIDOS } from '../lib/datos.mjs';

const ROOT = process.env.VETBA_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const P = (...x) => path.join(ROOT, ...x);
const CHECK = process.argv.includes('--check');
const data = leerJSON(P('data.json'));
const SRC = P('sources');
const archivos = existsSync(SRC) ? readdirSync(SRC) : [];
const primero = (v) => (v ? String(v).split(';')[0].trim() : null);
const digitos = (v) => (v ? String(v).replace(/\D/g, '') : null);

/* ---------------- candidatos ---------------- */
const candidatos = [];
const descartados = [];
for (const f of archivos.filter((f) => /^osm-.*\.json$/.test(f))) {
  const j = leerJSON(path.join(SRC, f));
  for (const e of j.elements || []) {
    const t = e.tags || {};
    if (!t.name) { descartados.push(f + ' ' + e.type + '/' + e.id + ': sin nombre'); continue; }
    const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon;
    const calle = t['addr:street'] ? t['addr:street'] + (t['addr:housenumber'] ? ' ' + t['addr:housenumber'] : '') : null;
    const wa = digitos(t['contact:whatsapp'] || t.whatsapp);
    const c = {
      nombre: t.name, tipo: clasificar({ nombre: t.name, tipo: null }, t).tipo, direccion: calle,
      localidad: t['addr:suburb'] || t['addr:city'] || null, partido: j.vetba?.partido || null,
      lat, lng, telefono: primero(t.phone || t['contact:phone']), servicios: [],
      osm_id: e.type + '/' + e.id, fuente: ['osm'],
    };
    if (wa) c.whatsapp = wa.startsWith('54') ? wa : null; // contact:whatsapp de OSM es explícito
    if (!c.whatsapp) delete c.whatsapp;
    const extra = { email: primero(t.email || t['contact:email']), web: primero(t.website || t['contact:website']), instagram: primero(t['contact:instagram']), facebook: primero(t['contact:facebook']) };
    for (const [k, v] of Object.entries(extra)) if (v) c[k] = v;
    const h = parsearOpeningHours(t.opening_hours); if (h) c.horarios = h;
    if (t.opening_hours && !h) c.horario = t.opening_hours; // se guarda como referencia, sin convertir
    candidatos.push(c);
  }
}
const TIPO_GOOGLE = [[/veterin/i, 'veterinaria'], [/pet groom|peluquer/i, 'peluqueria'], [/pet (store|supply)|tienda de (animales|mascotas)|productos para mascotas|alimentos para animales|pet shop/i, 'petshop']];
for (const f of archivos.filter((f) => /^apify-.*\.json$/.test(f))) {
  const j = leerJSON(path.join(SRC, f));
  const objetivo = [j.vetba?.localidad, j.vetba?.partido].filter(Boolean).map(norm);
  for (const it of j.items || []) {
    if (it.permanentlyClosed) { descartados.push(f + ' ' + it.title + ': cerrado permanentemente'); continue; }
    const dondeTxt = norm([it.city, it.neighborhood, it.address].join(' '));
    // Google devuelve resultados cercanos aunque estén en otro partido: se acepta todo lo que cae en el AMBA
    // y el partido definitivo lo pone validar-data --red por coordenadas (Nominatim).
    const la = it.location?.lat, lo = it.location?.lng;
    if (!(la > -35.3 && la < -34.1 && lo > -59.3 && lo < -57.7)) { descartados.push(f + ' ' + it.title + ': fuera del AMBA (' + (it.city || it.address) + ')'); continue; }
    void objetivo; void dondeTxt;
    const cat = [it.categoryName, ...(it.categories || [])].join(' ');
    const porCat = (TIPO_GOOGLE.find(([rx]) => rx.test(cat)) || [])[1];
    const c = {
      nombre: it.title, tipo: porCat || clasificar({ nombre: it.title, tipo: null }).tipo, direccion: it.street || it.address || null,
      localidad: it.neighborhood || it.city || null, partido: j.vetba?.partido || null,
      lat: it.location?.lat, lng: it.location?.lng, telefono: it.phone || null, servicios: [],
      rating: it.totalScore ?? null, 'reseñas': it.reviewsCount ?? null, placeId: it.placeId || null, fuente: ['google'],
    };
    if (it.website) c.web = it.website;
    const h = parsearHorarioGoogle(it.openingHours); if (h) { c.horarios = h; if (h['24h']) c.servicios.push('24hs'); }
    if (!c.tipo) { descartados.push(f + ' ' + it.title + ': rubro no reconocido (' + cat + ')'); continue; }
    candidatos.push(c);
  }
}

/* ---------------- unión ---------------- */
let maxId = Math.max(...data.map((r) => r.id));
const agregados = [], completados = [], dudosos = [];
for (const c of candidatos) {
  if (typeof c.lat !== 'number') { descartados.push(c.nombre + ': sin coordenadas'); continue; }
  const t = normalizarTelefono(c.telefono); if (t.valido) { c.telefono_e164 = t.e164; if (t.movil) c.celular = t.e164; }
  let match = null;
  for (const r of data) { const m = sonDuplicados(r, c); if (m?.fusionar) { match = r; break; } if (m) dudosos.push([r, c, m.motivo]); }
  if (match) {
    const antes = JSON.stringify(match);
    for (const [k, v] of Object.entries(c)) {
      if (v === null || v === undefined || (Array.isArray(v) && !v.length)) continue;
      if (k === 'fuente') match.fuente = [...new Set([...(match.fuente || []), ...v])];
      else if (match[k] === undefined || match[k] === null || match[k] === '') match[k] = v;
    }
    if (JSON.stringify(match) !== antes) completados.push(match.id + ' ' + match.nombre + ' (con ' + c.fuente.join('+') + ')');
    continue;
  }
  const n = { id: ++maxId, slug: null, ...c, zona: ZONAS_PARTIDO[c.partido] || null, barrio: c.localidad || null };
  for (const k of Object.keys(n)) if (n[k] === null) delete n[k];
  n.slug = null; // lo asigna scripts/slugs.mjs
  data.push(n); agregados.push(n);
}

const md = `# Unión de fuentes

Generado el ${new Date().toISOString().slice(0, 10)}. Archivos: ${archivos.filter((f) => /^(osm|apify)-/.test(f)).join(', ') || '(ninguno: no hay nada en sources/)'}

| | |
|---|---:|
| Candidatos leídos | ${candidatos.length} |
| Agregados (nuevos) | ${agregados.length} |
| Existentes completados | ${completados.length} |
| Coincidencias dudosas (se agregaron igual, revisar) | ${dudosos.length} |
| Descartados | ${descartados.length} |

Criterio de zona: ${Object.entries(ZONAS_PARTIDO).map(([p, z]) => p + ' → ' + z).join(' · ')}.

## Agregados por partido
${Object.entries(agregados.reduce((m, r) => (m[r.partido] = (m[r.partido] || 0) + 1, m), {})).map(([p, n]) => '- ' + p + ': ' + n).join('\n') || '- Ninguno'}

## Completados
${completados.map((x) => '- #' + x).join('\n') || '- Ninguno'}

## Dudosos
${dudosos.map(([r, c, m]) => '- #' + r.id + ' ' + r.nombre + ' ↔ ' + c.nombre + ' (' + c.fuente + '): ' + m).join('\n') || '- Ninguno'}

## Descartados
${descartados.map((x) => '- ' + x).join('\n') || '- Ninguno'}
`;
mkdirSync(P('reports'), { recursive: true });
writeFileSync(P('reports', 'fuentes.md'), md);
if (!CHECK && (agregados.length || completados.length)) escribirData(P('data.json'), data);
console.log(`Candidatos ${candidatos.length} | agregados ${agregados.length} | completados ${completados.length} | dudosos ${dudosos.length} | descartados ${descartados.length}`);
