#!/usr/bin/env node
// VetBA — PDFs A5 para visitas en persona: uno por establecimiento + uno con todos para imprimir.
//
//   node scripts/generar-materiales.mjs                                   (General San Martín -> materiales/san-martin/)
//   node scripts/generar-materiales.mjs --partido "Tres de Febrero" --out materiales/tres-de-febrero
//   node scripts/generar-materiales.mjs --barrio Palermo --out materiales/palermo
//
// Requiere: npm install (qrcode) y Playwright con Chromium (npm i -D playwright && npx playwright install chromium).
// El WhatsApp de contacto se lee del bloque CONFIG de index.html (una sola fuente de verdad).
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import QRCode from 'qrcode';
import { leerJSON, barrioDe, slugify } from './lib/datos.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.vetba.com.ar';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const partido = arg('--partido', process.argv.includes('--barrio') ? null : 'General San Martín');
const barrio = arg('--barrio', null);
const OUT = path.resolve(ROOT, arg('--out', 'materiales/' + (partido === 'General San Martín' ? 'san-martin' : slugify(partido || barrio))));

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright')); }

const cfg = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const WA = (/WHATSAPP_CONTACTO:\s*'(\d+)'/.exec(cfg) || [])[1];
if (!WA) throw new Error('No encontré CONFIG.WHATSAPP_CONTACTO en index.html');
const waTxt = WA.replace(/^549(11)(\d{4})(\d{4})$/, '+54 9 $1 $2-$3');
const logo = readFileSync(path.join(ROOT, 'favicon.svg'), 'utf8');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const data = leerJSON(path.join(ROOT, 'data.json'));
const lista = data.filter((r) => (partido ? r.partido === partido : barrioDe(r) === barrio)).sort((a, b) => String(barrioDe(a)).localeCompare(String(barrioDe(b)), 'es') || a.nombre.localeCompare(b.nombre, 'es'));
if (!lista.length) {
  console.log(`No hay establecimientos en ${partido ? 'el partido ' + partido : 'el barrio ' + barrio}. ` + (partido ? 'Falta cargar la zona (npm run fuentes:descargar && npm run fuentes:unir).' : ''));
  process.exit(0);
}

const CSS = `@page{size:A5;margin:0}*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#0F172A}
.hoja{width:148mm;height:210mm;padding:11mm 11mm 9mm;display:flex;flex-direction:column;page-break-after:always;overflow:hidden}
.top{display:flex;align-items:center;gap:3mm;font-weight:800;font-size:17pt;color:#0E7490}.top svg{width:11mm;height:11mm}
.kick{margin:7mm 0 1mm;font-size:10pt;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748B}
h1{font-size:21pt;line-height:1.1;margin:0 0 3mm}.lugar{background:#ECFEFF;border:1px solid #A5F3FC;border-radius:4mm;padding:3.5mm 4mm;margin:0 0 5mm}
.lugar b{display:block;font-size:13.5pt;line-height:1.2}.lugar span{font-size:9.5pt;color:#334155}
.mid{display:flex;gap:6mm;align-items:center}.qr{flex:none;text-align:center}.qr img{width:54mm;height:54mm;display:block}
.qr small{display:block;font-size:8.5pt;color:#334155;margin-top:1mm;max-width:54mm}
ul{list-style:none;margin:0;padding:0;display:grid;gap:3mm;font-size:11pt;line-height:1.35}li{padding-left:6mm;position:relative}
li:before{content:"";position:absolute;left:0;top:1.2mm;width:3mm;height:1.8mm;border-left:.6mm solid #047857;border-bottom:.6mm solid #047857;transform:rotate(-45deg)}
.gratis{margin-top:8mm;font-size:10pt;color:#334155}.pie{margin-top:auto;border-top:1px solid #E2E8F0;padding-top:4mm;display:flex;justify-content:space-between;align-items:flex-end;font-size:9.5pt}
.wa{font-size:13pt;font-weight:800;color:#128C7E}.url{color:#64748B;font-size:8pt;word-break:break-all;margin-top:1mm}`;

async function hoja(r) {
  const url = SITE + '/?reclamar=' + encodeURIComponent(r.slug);
  const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 1, width: 600, color: { dark: '#0F172A', light: '#FFFFFF' } });
  const lugar = [r.direccion, barrioDe(r), r.partido].filter(Boolean).join(', ');
  return `<section class="hoja">
  <div class="top">${logo.replace('<svg ', '<svg aria-hidden="true" ')}VetBA</div>
  <div class="kick">Directorio de veterinarias de CABA y GBA</div>
  <h1>${{ veterinaria: 'Tu veterinaria', peluqueria: 'Tu peluquería', petshop: 'Tu pet shop', laboratorio: 'Tu laboratorio' }[r.tipo] || 'Tu negocio'} ya aparece en VetBA</h1>
  <div class="lugar"><b>${esc(r.nombre)}</b><span>${esc(lugar)}</span></div>
  <div class="mid">
    <div class="qr"><img src="${qr}" alt=""><small>Escaneá para reclamar tu ficha</small></div>
    <ul>
      <li><b>Corregí tus datos:</b> dirección, teléfono, WhatsApp y servicios.</li>
      <li><b>Cargá tus horarios</b> por día, para que los dueños sepan cuándo atendés.</li>
      <li><b>Aparecé en "Abierto ahora"</b> y en el modo urgencia cuando estás abierto.</li>
    </ul>
  </div>
  <p class="gratis">Reclamar la ficha es <b>gratis</b>. Te lleva un minuto desde el celular.</p>
  <div class="pie"><div>¿Dudas? Escribime por WhatsApp<div class="wa">${esc(waTxt)}</div></div><div style="text-align:right">www.vetba.com.ar<div class="url">${esc(url.replace('https://', ''))}</div></div></div>
</section>`;
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const hojas = [];
for (const r of lista) {
  const h = await hoja(r); hojas.push(h);
  await page.setContent(`<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${h}</body></html>`);
  await page.pdf({ path: path.join(OUT, r.slug + '.pdf'), format: 'A5', printBackground: true, pageRanges: '1' });
}
await page.setContent(`<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${hojas.join('')}</body></html>`);
await page.pdf({ path: path.join(OUT, '_todos-para-imprimir.pdf'), format: 'A5', printBackground: true });
await browser.close();
writeFileSync(path.join(OUT, 'indice.csv'), '﻿archivo,nombre,barrio,partido,url_reclamar\n' + lista.map((r) => [r.slug + '.pdf', r.nombre, barrioDe(r) || '', r.partido || '', SITE + '/?reclamar=' + r.slug].map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n') + '\n');
console.log(`${lista.length} PDF + _todos-para-imprimir.pdf en ${path.relative(ROOT, OUT)}/`);
