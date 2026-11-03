#!/usr/bin/env node
// VetBA — completa email / WhatsApp / Instagram / Facebook desde la web PROPIA de cada lugar.
//
//   node scripts/fuentes/contactos-web.mjs            (solo registros con `web`)
//   node scripts/fuentes/contactos-web.mjs --check
//
// Reglas:
//  - Máximo 2 páginas por sitio (home + una de contacto), 1 pedido por segundo en total,
//    respeta robots.txt (User-agent: * y VetBA-data). Cachea en cache/web/.
//  - NO se scrapean redes sociales: solo se guarda la URL de Instagram/Facebook que aparece en su web.
//  - WhatsApp CONFIRMADO solo con links wa.me / api.whatsapp.com / whatsapp://send. Un celular
//    sin link de WhatsApp se guarda en `celular` y NO se muestra como botón verde.
//  - Solo completa campos vacíos; nunca pisa un dato existente.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { leerJSON, escribirData, normalizarTelefono } from '../lib/datos.mjs';

const ROOT = process.env.VETBA_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const P = (...x) => path.join(ROOT, ...x);
const UA = 'VetBA-data/1.0 (+https://www.vetba.com.ar)';
const CHECK = process.argv.includes('--check');

let ultimo = 0;
async function get(url) {
  const f = P('cache', 'web', createHash('sha1').update(url).digest('hex') + '.json');
  if (existsSync(f)) return JSON.parse(readFileSync(f, 'utf8'));
  const espera = 1000 - (Date.now() - ultimo); if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimo = Date.now();
  let out;
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,text/plain' }, redirect: 'follow', signal: ctrl.signal });
    clearTimeout(to);
    const tipo = r.headers.get('content-type') || '';
    out = { url: r.url, status: r.status, body: /html|text/.test(tipo) ? (await r.text()).slice(0, 1_500_000) : '' };
  } catch (e) { out = { url, status: 0, error: e.message, body: '' }; }
  mkdirSync(path.dirname(f), { recursive: true }); writeFileSync(f, JSON.stringify(out));
  return out;
}

// robots.txt mínimo: grupos "User-agent: *" o "VetBA-data", reglas Disallow/Allow por prefijo (gana la más larga).
export function permitido(robots, ruta) {
  const grupos = []; let g = null;
  for (const linea of String(robots || '').split(/\r?\n/)) {
    const m = /^\s*([a-z-]+)\s*:\s*(.*?)\s*(#.*)?$/i.exec(linea); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2];
    if (k === 'user-agent') { if (!g || g.reglas.length) { g = { agentes: [], reglas: [] }; grupos.push(g); } g.agentes.push(v.toLowerCase()); }
    else if (g && (k === 'disallow' || k === 'allow')) g.reglas.push([k, v]);
  }
  const mio = grupos.find((x) => x.agentes.some((a) => a.includes('vetba'))) || grupos.find((x) => x.agentes.includes('*'));
  if (!mio) return true;
  let mejor = null;
  for (const [k, v] of mio.reglas) if (v && ruta.startsWith(v.replace(/\*$/, '')) && (!mejor || v.length > mejor[1].length)) mejor = [k, v];
  return !mejor || mejor[0] === 'allow';
}

// Extrae datos de contacto de un HTML. Exportada para tests.
export function extraer(html, base) {
  const out = { emails: new Set(), whatsapp: new Set(), instagram: new Set(), facebook: new Set(), celulares: new Set(), contacto: null };
  const hrefs = [...String(html).matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1].replace(/&amp;/g, '&'));
  for (const h of hrefs) {
    let u; try { u = new URL(h, base); } catch { continue; }
    if (u.protocol === 'mailto:') { const e = decodeURIComponent(u.pathname).toLowerCase(); if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(e)) out.emails.add(e); continue; }
    if (u.protocol === 'tel:') { const t = normalizarTelefono(decodeURIComponent(u.pathname)); if (t.valido && t.movil) out.celulares.add(t.e164); continue; }
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'wa.me') { const d = u.pathname.replace(/\D/g, ''); if (d.length >= 11) out.whatsapp.add(d); continue; }
    if (host === 'api.whatsapp.com' || host === 'web.whatsapp.com' || u.protocol === 'whatsapp:') { const d = (u.searchParams.get('phone') || '').replace(/\D/g, ''); if (d.length >= 11) out.whatsapp.add(d); continue; }
    if (host === 'instagram.com' && /^\/[A-Za-z0-9_.]+\/?$/.test(u.pathname) && !/^\/(p|reel|explore|accounts)\b/.test(u.pathname)) { out.instagram.add('https://www.instagram.com' + u.pathname.replace(/\/$/, '')); continue; }
    if ((host === 'facebook.com' || host === 'm.facebook.com' || host === 'fb.com') && !/sharer|share\.php|plugins|dialog|tr\b/.test(u.pathname) && u.pathname.length > 1) { out.facebook.add('https://www.facebook.com' + u.pathname.replace(/\/$/, '')); continue; }
    if (!out.contacto && u.origin === new URL(base).origin && /contact/i.test(u.pathname + u.hash) && !u.hash) out.contacto = u.href;
  }
  const texto = String(html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  for (const m of texto.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) { const e = m[0].toLowerCase(); if (!/\.(png|jpe?g|gif|webp|svg)$/.test(e) && !/sentry|wixpress|example\./.test(e)) out.emails.add(e); }
  return out;
}

async function main() {
const data = leerJSON(P('data.json'));
const conWeb = data.filter((r) => r.web);
const log = [];
for (const r of conWeb) {
  let base; try { base = new URL(/^https?:/.test(r.web) ? r.web : 'https://' + r.web); } catch { log.push([r, 'URL inválida']); continue; }
  if (/instagram\.com|facebook\.com|linktr\.ee|wa\.me/.test(base.hostname)) { log.push([r, 'la "web" es una red social o un link: no se scrapea']); continue; }
  const robots = await get(base.origin + '/robots.txt');
  const rb = robots.status === 200 ? robots.body : '';
  if (!permitido(rb, base.pathname)) { log.push([r, 'robots.txt no permite la home']); continue; }
  const home = await get(base.href);
  if (home.status !== 200) { log.push([r, 'home HTTP ' + (home.status || home.error)]); continue; }
  const a = extraer(home.body, home.url);
  if (a.contacto && permitido(rb, new URL(a.contacto).pathname)) {
    const c = await get(a.contacto);
    if (c.status === 200) { const b = extraer(c.body, c.url); for (const k of ['emails', 'whatsapp', 'instagram', 'facebook', 'celulares']) for (const v of b[k]) a[k].add(v); }
  }
  const nuevo = {};
  const set = (k, v) => { if (v && !r[k]) { r[k] = v; nuevo[k] = v; } };
  const dominio = base.hostname.replace(/^www\./, '');
  // Si hay varios emails, se prefiere el del propio dominio.
  set('email', [...a.emails].sort((x, y) => (y.endsWith(dominio) ? 1 : 0) - (x.endsWith(dominio) ? 1 : 0))[0]);
  set('whatsapp', [...a.whatsapp][0]);
  set('instagram', [...a.instagram][0]);
  set('facebook', [...a.facebook][0]);
  if (!r.whatsapp) set('celular', [...a.celulares][0]);
  if (Object.keys(nuevo).length) r.contacto_web_revisado = new Date().toISOString().slice(0, 10);
  log.push([r, Object.keys(nuevo).length ? 'nuevo: ' + Object.entries(nuevo).map(([k, v]) => k + '=' + v).join(', ') : 'sin datos nuevos']);
}
mkdirSync(P('reports'), { recursive: true });
writeFileSync(P('reports', 'contactos-web.md'), '# Contactos desde webs propias\n\nRegistros con web: ' + conWeb.length + '\n\n' + log.map(([r, m]) => '- #' + r.id + ' ' + r.nombre + ' (' + r.web + '): ' + m).join('\n') + '\n');
if (!CHECK) escribirData(P('data.json'), data);
console.log('Registros con web: ' + conWeb.length + ' | con datos nuevos: ' + log.filter(([, m]) => m.startsWith('nuevo')).length);
}
// Solo corre si se invoca directamente (importarlo para tests no toca data.json).
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) await main();
