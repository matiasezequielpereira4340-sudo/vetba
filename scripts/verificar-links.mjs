#!/usr/bin/env node
// VetBA — verifica que no haya links internos rotos en las páginas (correr después de build:seo).
//   node scripts/verificar-links.mjs      (sale con código 1 si encuentra rotos)
// Revisa: href/src internos de todas las .html, destinos de los redirects de vercel.json,
// URLs del sitemap, títulos duplicados y JSON-LD inválido.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.VETBA_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IGNORAR = new Set(['node_modules', '.git', 'vendor', 'cache', 'sources', 'reports', 'contactos', 'materiales', 'docs']);
function html(dir, out = []) {
  for (const f of readdirSync(dir)) {
    if (IGNORAR.has(f)) continue;
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) html(p, out); else if (f.endsWith('.html') && f !== 'admin-local.html') out.push(p);
  }
  return out;
}
// Igual que Vercel con cleanUrls: /x -> x.html o x/index.html
function existe(ruta) {
  const r = decodeURIComponent(ruta.split('#')[0].split('?')[0]).replace(/^\//, '');
  if (r === '') return true;
  const p = path.join(ROOT, r);
  return (existsSync(p) && statSync(p).isFile()) || existsSync(p + '.html') || existsSync(path.join(p, 'index.html'));
}
const paginas = html(ROOT);
const rotos = new Map(), titulos = new Map(), jsonld = [];
let links = 0;
for (const f of paginas) {
  const s = readFileSync(f, 'utf8');
  const rel = '/' + path.relative(ROOT, f);
  const t = (/<title>([^<]*)<\/title>/.exec(s) || [])[1];
  if (t) titulos.set(t, [...(titulos.get(t) || []), rel]);
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { jsonld.push(rel + ': ' + e.message); } }
  // Solo atributos del HTML (no plantillas dentro de <script>, que arman URLs en tiempo de ejecución).
  const sinScripts = s.replace(/<script[\s\S]*?<\/script>/gi, '');
  for (const m of sinScripts.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
    if (m[1].startsWith('//') || m[1].startsWith('/_vercel/')) continue;
    links++;
    if (!existe(m[1])) rotos.set(m[1], [...(rotos.get(m[1]) || []), rel]);
  }
}
const vj = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const redirMal = (vj.redirects || []).filter((r) => !r.destination.includes(':') && !existe(r.destination)).map((r) => r.source + ' -> ' + r.destination);
const sitemapMal = existsSync(path.join(ROOT, 'sitemap.xml')) ? [...readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>https:\/\/www\.vetba\.com\.ar([^<]*)<\/loc>/g)].map((m) => m[1] || '/').filter((u) => !existe(u)) : ['(no hay sitemap.xml: corré npm run build:seo)'];
const dupTit = [...titulos].filter(([, v]) => v.length > 1);

console.log(`Páginas: ${paginas.length} | links internos revisados: ${links} | rotos: ${rotos.size} | redirects sin destino: ${redirMal.length} | sitemap sin página: ${sitemapMal.length} | títulos duplicados: ${dupTit.length} | JSON-LD inválido: ${jsonld.length}`);
for (const [u, en] of rotos) console.log('  ROTO ' + u + ' (en ' + en.slice(0, 3).join(', ') + (en.length > 3 ? ' y ' + (en.length - 3) + ' más' : '') + ')');
redirMal.forEach((x) => console.log('  REDIRECT ' + x));
sitemapMal.forEach((x) => console.log('  SITEMAP ' + x));
dupTit.forEach(([t, v]) => console.log('  TÍTULO DUPLICADO "' + t + '": ' + v.join(', ')));
jsonld.forEach((x) => console.log('  JSON-LD ' + x));
if (rotos.size || redirMal.length || sitemapMal.length || dupTit.length || jsonld.length) process.exitCode = 1;
