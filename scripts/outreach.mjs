#!/usr/bin/env node
// VetBA — base para contactar establecimientos: contactos/outreach.csv
//   node scripts/outreach.mjs
// Orden: General San Martín (José León Suárez y Villa Ballester primero), Tres de Febrero,
// Vicente López, San Isidro y el resto. Dentro de cada grupo: veterinarias primero y mejor calificadas.
// `whatsapp` = confirmado (link en su web, OSM o el propio negocio). `celular` = número móvil sin
// WhatsApp confirmado: NO usar como si fuera WhatsApp.
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerJSON, barrioDe, norm } from './lib/datos.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.vetba.com.ar';
const data = leerJSON(path.join(ROOT, 'data.json'));

const ORDEN_PARTIDO = ['General San Martín', 'Tres de Febrero', 'Vicente López', 'San Isidro'];
const PRIMERO = ['jose leon suarez', 'villa ballester'];
const grupo = (r) => { const i = ORDEN_PARTIDO.indexOf(r.partido); return i === -1 ? ORDEN_PARTIDO.length : i; };
const top = (r) => (r.partido === 'General San Martín' && PRIMERO.includes(norm(barrioDe(r)))) ? PRIMERO.indexOf(norm(barrioDe(r))) : PRIMERO.length;
const TIPO = { veterinaria: 0, peluqueria: 1, petshop: 2, laboratorio: 3 };
const score = (r) => { const v = +r['reseñas'] || 0, R = +r.rating || 0; return R ? (v * R + 20 * 4.4) / (v + 20) : 0; };

const filas = data.slice().sort((a, b) => grupo(a) - grupo(b) || top(a) - top(b) || (TIPO[a.tipo] ?? 9) - (TIPO[b.tipo] ?? 9) || score(b) - score(a));
const cols = ['id', 'nombre', 'tipo', 'barrio', 'partido', 'zona', 'telefono', 'celular', 'whatsapp', 'email', 'instagram', 'web', 'rating', 'reseñas', 'url_ficha', 'url_reclamar'];
const val = (r, c) => ({
  barrio: barrioDe(r), telefono: r.telefono_e164 || r.telefono,
  url_ficha: r.slug ? SITE + '/ficha/' + r.slug : '', url_reclamar: r.slug ? SITE + '/?reclamar=' + encodeURIComponent(r.slug) : '',
}[c] ?? r[c]);
const csv = [cols.join(','), ...filas.map((r) => cols.map((c) => '"' + String(val(r, c) ?? '').replace(/"/g, '""') + '"').join(','))].join('\n') + '\n';
mkdirSync(path.join(ROOT, 'contactos'), { recursive: true });
writeFileSync(path.join(ROOT, 'contactos', 'outreach.csv'), '﻿' + csv); // BOM: Excel abre bien los acentos
const n = (f) => filas.filter(f).length;
console.log(`contactos/outreach.csv: ${filas.length} filas | San Martín ${n((r) => r.partido === 'General San Martín')} | con email ${n((r) => r.email)} | con WhatsApp confirmado ${n((r) => r.whatsapp)} | con email o WhatsApp ${n((r) => r.email || r.whatsapp)} | solo teléfono ${n((r) => !r.email && !r.whatsapp && r.telefono_e164)}`);
