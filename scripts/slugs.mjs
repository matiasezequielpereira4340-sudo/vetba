#!/usr/bin/env node
// VetBA — slugs definitivos de ficha (/ficha/<nombre>) y redirects 301 de los viejos.
//   node scripts/slugs.mjs
//
// Regla: <nombre>; si choca, <nombre>-<barrio>; si sigue chocando, -2, -3…
// Un slug asignado queda fijo (`slug_definitivo: true`): correr el script de nuevo o sumar
// registros no cambia URLs ya publicadas. Los slugs anteriores quedan en `slugs_anteriores`
// y se generan los redirects en vercel.json (también los de registros fusionados).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerJSON, escribirData, slugify, barrioDe } from './lib/datos.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = leerJSON(path.join(ROOT, 'data.json'));
const MAX = 60;
const corto = (s) => { if (s.length <= MAX) return s; const c = s.slice(0, MAX); return c.slice(0, c.lastIndexOf('-') > 20 ? c.lastIndexOf('-') : MAX); };

const usados = new Set(data.filter((r) => r.slug_definitivo && r.slug).map((r) => r.slug));
let cambios = 0;
for (const r of data.slice().sort((a, b) => a.id - b.id)) {
  if (r.slug_definitivo && r.slug) continue;
  const base = corto(slugify(r.nombre)) || 'lugar';
  const lugar = slugify(barrioDe(r) || r.partido || r.zona || '');
  let s = base;
  if (usados.has(s) && lugar) s = corto(base + '-' + lugar);
  for (let i = 2; usados.has(s); i++) s = corto(base + (lugar ? '-' + lugar : '')) + '-' + i;
  if (r.slug && r.slug !== s) r.slugs_anteriores = [...new Set([...(r.slugs_anteriores || []), r.slug])];
  if (r.slug !== s) cambios++;
  r.slug = s; r.slug_definitivo = true; usados.add(s);
}
const todos = new Set(data.map((r) => r.slug));
if (todos.size !== data.length) throw new Error('Slugs duplicados');

// redirects
const vj = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const fijos = [{ source: '/veterinarias-:barrio', destination: '/veterinarias/:barrio', permanent: true }];
const fichas = [];
for (const r of data) for (const v of r.slugs_anteriores || []) if (v !== r.slug && !todos.has(v)) fichas.push({ source: '/ficha/' + v, destination: '/ficha/' + r.slug, permanent: true });
vj.redirects = [...fijos, ...fichas.sort((a, b) => a.source.localeCompare(b.source))];
if (vj.redirects.length > 2000) throw new Error('Vercel admite hasta 2048 redirects: ' + vj.redirects.length);
writeFileSync(path.join(ROOT, 'vercel.json'), JSON.stringify(vj, null, 2) + '\n');
escribirData(path.join(ROOT, 'data.json'), data);
console.log(`Slugs cambiados: ${cambios} | redirects de fichas: ${fichas.length} | total redirects: ${vj.redirects.length}`);
