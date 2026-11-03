#!/usr/bin/env node
// VetBA — descarga de fuentes GRATUITAS a sources/ (crudo, sin modificar).
//
//   node scripts/fuentes/descargar.mjs barrios          GeoJSON oficial de barrios de CABA (Buenos Aires Data)
//   node scripts/fuentes/descargar.mjs osm              Overpass: veterinarias, pet shops y peluquerías por partido
//   node scripts/fuentes/descargar.mjs apify            Google Maps vía Apify (OPCIONAL, requiere APIFY_TOKEN)
//   node scripts/fuentes/descargar.mjs apify --max 10 --confirmar
//
// Dominios que necesita: cdn.buenosaires.gob.ar, overpass-api.de, api.apify.com
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify, PARTIDOS } from '../lib/datos.mjs';

const ROOT = process.env.VETBA_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'sources');
const UA = 'VetBA-data/1.0 (+https://www.vetba.com.ar)';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
mkdirSync(SRC, { recursive: true });



async function barrios() {
  const urls = [
    'https://cdn.buenosaires.gob.ar/datosabiertos/datasets/ministerio-de-educacion/barrios/barrios.geojson',
    'https://cdn.buenosaires.gob.ar/datosabiertos/datasets/barrios/barrios.geojson',
  ];
  for (const u of urls) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': UA } });
      if (!r.ok) { console.log(u + ' -> HTTP ' + r.status); continue; }
      const j = await r.json();
      if (!Array.isArray(j.features) || j.features.length < 40) throw new Error('GeoJSON inesperado (' + (j.features || []).length + ' features)');
      writeFileSync(path.join(SRC, 'barrios-caba.geojson'), JSON.stringify(j));
      console.log('OK sources/barrios-caba.geojson (' + j.features.length + ' barrios) desde ' + u);
      return;
    } catch (e) { console.log(u + ' -> ' + e.message); }
  }
  process.exitCode = 1;
}

async function osm() {
  for (const partido of Object.keys(PARTIDOS)) {
    const q = `[out:json][timeout:120];
area["boundary"="administrative"]["admin_level"="5"]["name"~"^(Partido de )?${partido}$"]->.p;
(
  nwr(area.p)["amenity"="veterinary"](-35.3,-59.3,-34.1,-57.7);
  nwr(area.p)["shop"="pet"](-35.3,-59.3,-34.1,-57.7);
  nwr(area.p)["shop"="pet_grooming"](-35.3,-59.3,-34.1,-57.7);
);
out center tags;`;
    // OVERPASS_URL permite usar otro endpoint (p. ej. http:// si el proxy corta el TLS). Reintenta ante 429/5xx.
    const OVERPASS = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
    let r;
    for (let i = 0; i < 6; i++) {
      try { r = await fetch(OVERPASS, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q) }); } catch (e) { r = { ok: false, status: e.message }; }
      if (r.ok) break;
      console.log(partido + ' -> HTTP ' + r.status + ', reintento ' + (i + 1) + '/6 en 40 s');
      await new Promise((res) => setTimeout(res, 40000));
    }
    if (!r.ok) { console.log(partido + ' -> HTTP ' + r.status); process.exitCode = 1; continue; }
    const j = await r.json();
    j.vetba = { partido, descargado: new Date().toISOString(), consulta: q, licencia: 'ODbL — © colaboradores de OpenStreetMap' };
    const f = 'osm-' + slugify(partido) + '.json';
    writeFileSync(path.join(SRC, f), JSON.stringify(j, null, 1));
    console.log('OK sources/' + f + ': ' + (j.elements || []).length + ' elementos');
    await new Promise((res) => setTimeout(res, 5000)); // ser amables con Overpass
  }
}

async function apify() {
  const token = process.env.APIFY_TOKEN;
  if (!token) { console.log('No hay APIFY_TOKEN: se saltea Google Maps (Apify). Es opcional.'); return; }
  const max = +arg('--max', 10);
  const busquedas = ['veterinaria', 'veterinaria 24 horas', 'pet shop', 'peluquería canina'];
  const lugares = [];
  for (const [p, locs] of Object.entries(PARTIDOS)) for (const l of locs || [p]) lugares.push({ partido: p, localidad: l });
  const maxLugares = busquedas.length * lugares.length * max;
  // compass/crawler-google-places cobra por lugar extraído (pay-per-event). Referencia: ~USD 4 cada 1.000
  // lugares. Verificá el precio vigente en https://apify.com/compass/crawler-google-places antes de confirmar.
  const usd = (maxLugares / 1000) * 4;
  console.log(`Búsquedas: ${busquedas.length} términos × ${lugares.length} localidades, tope ${max} resultados por búsqueda.`);
  console.log(`Máximo ${maxLugares} lugares ≈ USD ${usd.toFixed(2)} (el crédito gratis mensual de Apify es USD 5). Hay muchos repetidos entre búsquedas.`);
  if (!process.argv.includes('--confirmar')) { console.log('No se ejecutó nada. Para correrlo: agregá --confirmar (y opcional --max N).'); return; }
  for (const { partido, localidad } of lugares) {
    const input = { searchStringsArray: busquedas, locationQuery: localidad + ', ' + (localidad === partido ? '' : partido + ', ') + 'Buenos Aires, Argentina', maxCrawledPlacesPerSearch: max, language: 'es', skipClosedPlaces: false };
    const run = await (await fetch('https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=' + token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })).json();
    const id = run?.data?.id; if (!id) { console.log('Error al iniciar ' + localidad + ': ' + JSON.stringify(run).slice(0, 200)); continue; }
    let st;
    do { await new Promise((res) => setTimeout(res, 10000)); st = (await (await fetch('https://api.apify.com/v2/actor-runs/' + id + '?token=' + token)).json()).data; } while (['READY', 'RUNNING'].includes(st.status));
    if (st.status !== 'SUCCEEDED') { console.log(localidad + ': run ' + st.status); continue; }
    const items = await (await fetch('https://api.apify.com/v2/datasets/' + st.defaultDatasetId + '/items?clean=true&format=json&token=' + token)).json();
    const f = 'apify-' + slugify(partido) + '-' + slugify(localidad) + '.json';
    writeFileSync(path.join(SRC, f), JSON.stringify({ vetba: { partido, localidad, descargado: new Date().toISOString(), costoUsd: st.usageTotalUsd }, items }, null, 1));
    console.log('OK sources/' + f + ': ' + items.length + ' lugares (USD ' + (st.usageTotalUsd ?? '?') + ')');
  }
}

const cmd = process.argv[2];
if (cmd === 'barrios') await barrios();
else if (cmd === 'osm') await osm();
else if (cmd === 'apify') await apify();
else console.log('Uso: node scripts/fuentes/descargar.mjs barrios|osm|apify');
