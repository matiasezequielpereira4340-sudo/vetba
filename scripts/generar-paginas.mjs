#!/usr/bin/env node
// VetBA — generador de páginas estáticas SEO (sin dependencias).
//
//   node scripts/generar-paginas.mjs        (o: npm run build:seo)
//
// Lee data.json y genera:
//   /veterinarias/index.html                      índice de barrios
//   /veterinarias/<barrio>/index.html             una por barrio/localidad con registros
//   /urgencias-24-horas/index.html                índice
//   /urgencias-24-horas/<zona>/index.html         una por zona con lugares 24 h
//   /ficha/<slug>/index.html                      una por establecimiento
//   /sitemap.xml y /robots.txt
//
// Todo el contenido va renderizado en el HTML (no depende de JS). Las carpetas
// generadas están en .gitignore: en Vercel se crean en cada deploy (buildCommand).
// El sitio principal (index.html + data.json) funciona igual sin correr este script.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.vetba.com.ar';
const WHATSAPP_CONTACTO = '5491160374306';
const HOY = new Date().toISOString().slice(0, 10);

// Las calificaciones de data.json son de Google, no recolectadas por VetBA.
// Las directrices de Google para fragmentos de reseñas no permiten marcar reseñas
// tomadas de otro sitio: activarlo puede generar una acción manual. Encendelo solo
// cuando VetBA tenga reseñas propias.
const INCLUIR_AGGREGATE_RATING = false;

const data = JSON.parse(readFileSync(path.join(ROOT, 'data.json'), 'utf8'));

/* ---------------- utilidades ---------------- */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slugify = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const barrioDe = (r) => (r.barrio !== undefined ? r.barrio : r.localidad) || null;
const es24 = (r) => !!(r.horarios && r.horarios['24h']);
const esPago = (r) => r.plan === 'pro' || r.plan === 'premium';
const nf1 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('es-AR');
const score = (r) => { const v = +r['reseñas'] || 0, R = +r.rating || 0; return R ? (v * R + 20 * 4.4) / (v + 20) : 0; };
const orden = (a, b) => ((b.plan === 'premium' ? 2 : b.plan === 'pro' ? 1 : 0) - (a.plan === 'premium' ? 2 : a.plan === 'pro' ? 1 : 0)) || score(b) - score(a);
const e164 = (t) => { const d = String(t || '').replace(/\D/g, ''); if (!d) return ''; return d.startsWith('54') ? '+' + d : '+54' + d.replace(/^0/, ''); };
const mapsHref = (r) => 'https://www.google.com/maps/dir/?api=1&destination=' + r.lat + ',' + r.lng + (r.placeId ? '&destination_place_id=' + encodeURIComponent(r.placeId) : '');
const waLink = (num, msg) => 'https://wa.me/' + String(num).replace(/\D/g, '') + (msg ? '?text=' + encodeURIComponent(msg) : '');
const km = (a, b) => { const R = 6371, rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad; const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const plural = (n, s, p) => nf0.format(n) + ' ' + (n === 1 ? s : p);

const TIPO = { veterinaria: 'Veterinaria', peluqueria: 'Peluquería canina', petshop: 'Pet shop', laboratorio: 'Laboratorio veterinario' };
const TIPO_PL = { veterinaria: 'veterinarias', peluqueria: 'peluquerías caninas', petshop: 'pet shops', laboratorio: 'laboratorios veterinarios' };
const SERV = { consultas: 'Consultas', vacunacion: 'Vacunación', '24hs': '24 horas', urgencias: 'Urgencias', internacion: 'Internación', peluqueria: 'Peluquería', bano: 'Baño', alimentos: 'Alimentos', accesorios: 'Accesorios', petshop: 'Pet shop', laboratorio: 'Laboratorio', analisis: 'Análisis' };
const servLabel = (s) => SERV[s] || s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
const SCHEMA_TYPE = { veterinaria: 'VeterinaryCare', petshop: 'PetStore', peluqueria: 'LocalBusiness', laboratorio: 'MedicalBusiness' };
const DIAS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
const DIAS_SCHEMA = { lun: 'Monday', mar: 'Tuesday', mie: 'Wednesday', jue: 'Thursday', vie: 'Friday', sab: 'Saturday', dom: 'Sunday' };
const DIAS_TXT = { lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo' };
const ZONA_SLUG = (z) => slugify(z);
const REGION = (z) => (z === 'CABA' ? 'Ciudad Autónoma de Buenos Aires' : 'Buenos Aires');

const fichaUrl = (r) => SITE + '/ficha/' + r.slug;
const barrioUrl = (b) => SITE + '/veterinarias/' + slugify(b);

/* ---------------- horarios ---------------- */
function openingHoursSpec(r) {
  const h = r.horarios;
  if (!h) return undefined;
  if (h['24h']) return [{ '@type': 'OpeningHoursSpecification', dayOfWeek: Object.values(DIAS_SCHEMA), opens: '00:00', closes: '23:59' }];
  const out = [];
  for (const d of DIAS) {
    if (!Array.isArray(h[d])) continue;
    for (const f of h[d]) {
      const m = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(f);
      if (m) out.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: DIAS_SCHEMA[d], opens: m[1], closes: m[2] === '24:00' ? '23:59' : m[2] });
    }
  }
  return out.length ? out : undefined;
}
function horarioHTML(r) {
  const h = r.horarios;
  if (h && h['24h']) return '<span class="st abierto">Abierto 24 h</span>';
  if (h) {
    const filas = DIAS.filter((d) => Array.isArray(h[d])).map((d) => '<tr><td>' + DIAS_TXT[d] + '</td><td>' + (h[d].length ? esc(h[d].join(' y ').replace(/-/g, ' a ')) : 'Cerrado') + '</td></tr>').join('');
    return '<span class="st desconocido" data-h="' + esc(JSON.stringify(h)) + '">Horario</span>' + (filas ? '<table class="hs">' + filas + '</table>' : '');
  }
  return '<span class="st desconocido">Horario no informado</span>';
}

/* ---------------- plantilla ---------------- */
const CSS = `:root{--brand:#0E7490;--ink:#0F172A;--ink-2:#334155;--mute:#64748B;--bg:#F8FAFC;--line:#E2E8F0;--ok:#047857;--ok-bg:#ECFDF5;--bad:#B91C1C;--bad-bg:#FEF2F2;--wa:#128C7E;--urg:#DC2626}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.55;padding-bottom:84px}
a{color:var(--brand)}.wrap{max-width:960px;margin:0 auto;padding:0 16px}
.top{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5}.top .wrap{display:flex;align-items:center;gap:10px;min-height:56px}
.logo{font-weight:800;font-size:20px;color:var(--ink);text-decoration:none;margin-right:auto}
.b{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:0 14px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;border:1px solid var(--line);background:#fff;color:var(--ink)}
.b.call{background:var(--brand);border-color:var(--brand);color:#fff}.b.wa{background:var(--wa);border-color:var(--wa);color:#fff}.b.dark{background:var(--ink);border-color:var(--ink);color:#fff}.b.urg{background:var(--urg);border-color:var(--urg);color:#fff}
.b.big{min-height:54px;font-size:16px}
.bc{font-size:13.5px;color:var(--mute);margin:16px 0 6px}.bc ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:4px}.bc li+li:before{content:"›";margin-right:4px}
h1{font-size:clamp(24px,6vw,34px);line-height:1.15;margin:4px 0 8px;letter-spacing:-.4px}h2{font-size:20px;margin:26px 0 10px}
.lead{color:var(--ink-2);margin:0 0 18px;max-width:70ch}
.cards{display:grid;gap:12px}@media(min-width:700px){.cards{grid-template-columns:1fr 1fr}}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:6px}
.card.pro{border-color:#F6E05E}.card h3{margin:0;font-size:17px}.card h3 a{color:var(--ink)}
.meta{font-size:14px;color:var(--ink-2)}.tags{display:flex;flex-wrap:wrap;gap:6px}
.tag{font-size:12px;font-weight:700;border-radius:999px;padding:3px 9px;background:#F1F5F9;color:var(--ink-2);border:1px solid var(--line)}
.st{font-size:12.5px;font-weight:700;border-radius:999px;padding:3px 9px;display:inline-block}.st.abierto{background:var(--ok-bg);color:var(--ok)}.st.cerrado{background:var(--bad-bg);color:var(--bad)}.st.desconocido{background:#F1F5F9;color:var(--mute)}
.acts{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:6px}
.links{display:flex;flex-wrap:wrap;gap:8px}.links a{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border-radius:999px;background:#fff;border:1px solid var(--line);text-decoration:none;font-weight:600}
.box{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;margin:12px 0}
.note{font-size:13px;color:var(--mute)}.hs{border-collapse:collapse;margin-top:6px;font-size:14px}.hs td{padding:3px 14px 3px 0}
.prices{border-collapse:collapse;width:100%;max-width:420px}.prices td{padding:6px 0;border-bottom:1px solid var(--line)}.prices td+td{text-align:right;font-weight:700}
.map{width:100%;height:280px;border:0;border-radius:14px;background:#E5E7EB}
.urg-fab{position:fixed;left:12px;right:12px;bottom:12px;z-index:9;min-height:56px;font-size:16px}@media(min-width:900px){.urg-fab{display:none}body{padding-bottom:0}}
footer{background:#0F172A;color:#CBD5E1;padding:26px 0;margin-top:30px;font-size:14px}footer a{color:#E2E8F0}`;

// Script mínimo: badge de horario en vivo (hora de Argentina) y tracking de contactos.
const JS = `(function(){window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
document.addEventListener('click',function(e){var t=e.target.closest('[data-track]');if(t){try{window.va('event',{name:t.dataset.track,data:{ficha:t.dataset.id+':'+t.dataset.slug,origen:t.dataset.origen||'seo'}})}catch(x){}}});
var D=['dom','lun','mar','mie','jue','vie','sab'];function now(){var p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Buenos_Aires',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()),g=function(t){return(p.find(function(x){return x.type===t})||{}).value};return{d:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(g('weekday')),m:(+g('hour')%24)*60+(+g('minute'))}}
function fr(h,d){var v=h[D[d]];if(!Array.isArray(v))return null;return v.map(function(f){var m=/^(\\d{1,2}):(\\d{2})-(\\d{1,2}):(\\d{2})$/.exec(f);if(!m)return null;var a=m[1]*60+ +m[2],b=m[3]*60+ +m[4];if(b<=a)b+=1440;return[a,b]}).filter(Boolean).sort(function(x,y){return x[0]-y[0]})}
function hh(m){m=((m%1440)+1440)%1440;return('0'+Math.floor(m/60)).slice(-2)+':'+('0'+m%60).slice(-2)}
function est(h){var n=now(),t=fr(h,n.d),y=fr(h,(n.d+6)%7),i,f;if(y)for(i=0;i<y.length;i++)if(y[i][1]>1440&&n.m<y[i][1]-1440)return['abierto','Abierto · cierra '+hh(y[i][1])];if(t)for(i=0;i<t.length;i++)if(n.m>=t[i][0]&&n.m<t[i][1])return['abierto','Abierto · cierra '+hh(t[i][1])];if(!t)return['desconocido','Horario de hoy no informado'];for(i=0;i<t.length;i++)if(t[i][0]>n.m)return['cerrado','Abre a las '+hh(t[i][0])];for(i=1;i<=7;i++){f=fr(h,(n.d+i)%7);if(!f)return['cerrado','Cerrado'];if(f.length)return['cerrado','Abre '+(i===1?'mañana':'el '+D[(n.d+i)%7])+' a las '+hh(f[0][0])]}return['cerrado','Cerrado']}
document.querySelectorAll('[data-h]').forEach(function(el){try{var r=est(JSON.parse(el.getAttribute('data-h')));el.className='st '+r[0];el.textContent=r[1]}catch(x){}})})();`;

function page({ title, desc, canonical, body, jsonld = [], noindex = false }) {
  return `<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex,follow">\n' : ''}<meta name="theme-color" content="#0E7490">
<meta property="og:type" content="website">
<meta property="og:site_name" content="VetBA">
<meta property="og:locale" content="es_AR">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/og.jpg">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>${CSS}</style>
${jsonld.map((o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>').join('\n')}
</head>
<body>
<header class="top"><div class="wrap"><a class="logo" href="/">VetBA</a><a class="b" href="/#directorio">Buscar</a></div></header>
<main class="wrap">
${body}
</main>
<a class="b urg urg-fab" href="/?urgencia=1">Urgencia: veterinaria abierta ahora</a>
<footer><div class="wrap">
<p><a href="/">VetBA</a> · <a href="/veterinarias/">Veterinarias por barrio</a> · <a href="/urgencias-24-horas/">Urgencias 24 horas</a> · <a href="/recordatorios.html">Recordatorio de vacunas</a> · <a href="/terminos.html">Términos</a> · <a href="/privacidad.html">Privacidad</a></p>
<p>Calificaciones y reseñas: Google. Los datos pueden cambiar: llamá antes de ir.</p>
</div></footer>
<script>${JS}</script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;
}
function breadcrumbs(items) { // [[nombre, url|null], ...]
  const html = '<nav class="bc" aria-label="Migas de pan"><ol>' + items.map(([n, u]) => '<li>' + (u ? '<a href="' + u.replace(SITE, '') + '">' + esc(n) + '</a>' : '<span aria-current="page">' + esc(n) + '</span>') + '</li>').join('') + '</ol></nav>';
  const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, u], i) => Object.assign({ '@type': 'ListItem', position: i + 1, name: n }, u ? { item: u } : {})) };
  return { html, ld };
}
function actions(r, origen) {
  const da = ' data-id="' + r.id + '" data-slug="' + esc(r.slug) + '" data-origen="' + origen + '"';
  const tel = e164(r.telefono);
  return '<div class="acts">' +
    (tel ? '<a class="b call" href="tel:' + tel + '" data-track="Llamar"' + da + '>Llamar</a>' : '') +
    (r.whatsapp ? '<a class="b wa" href="' + esc(waLink(r.whatsapp, 'Hola, los encontré en VetBA, quería hacer una consulta')) + '" target="_blank" rel="noopener" data-track="WhatsApp"' + da + '>WhatsApp</a>' : '') +
    '<a class="b" href="' + esc(mapsHref(r)) + '" target="_blank" rel="noopener" data-track="Como llegar"' + da + '>Cómo llegar</a></div>';
}
function card(r, origen) {
  const b = barrioDe(r);
  return '<article class="card' + (esPago(r) ? ' pro' : '') + '"><div class="tags"><span class="tag">' + esc(TIPO[r.tipo] || r.tipo) + '</span>' + (esPago(r) ? '<span class="tag">✓ Verificado</span>' : '') + horarioHTML({ horarios: r.horarios }).replace(/<table.*$/, '') + '</div>' +
    '<h3><a href="/ficha/' + esc(r.slug) + '">' + esc(r.nombre) + '</a></h3>' +
    '<div class="meta">' + esc(r.direccion) + (b ? ' · ' + esc(b) : '') + '</div>' +
    (+r.rating > 0 ? '<div class="meta"><b>' + nf1.format(r.rating) + ' ★</b> (' + nf0.format(r['reseñas'] || 0) + ' reseñas en Google)</div>' : '') +
    actions(r, origen) + '</article>';
}
function businessLD(r) {
  const b = barrioDe(r);
  const o = {
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPE[r.tipo] || 'LocalBusiness',
    '@id': fichaUrl(r) + '#negocio',
    name: r.nombre,
    url: fichaUrl(r),
    address: { '@type': 'PostalAddress', streetAddress: r.direccion, addressLocality: b || r.zona, addressRegion: REGION(r.zona), addressCountry: 'AR' }
  };
  if (r.telefono) o.telephone = e164(r.telefono);
  if (typeof r.lat === 'number') o.geo = { '@type': 'GeoCoordinates', latitude: r.lat, longitude: r.lng };
  if (r.placeId) o.hasMap = 'https://www.google.com/maps/place/?q=place_id:' + r.placeId;
  const oh = openingHoursSpec(r); if (oh) o.openingHoursSpecification = oh;
  if (INCLUIR_AGGREGATE_RATING && +r.rating > 0 && +r['reseñas'] > 0) o.aggregateRating = { '@type': 'AggregateRating', ratingValue: r.rating, reviewCount: r['reseñas'], bestRating: 5, worstRating: 1 };
  return o;
}
function write(rel, html) {
  const file = path.join(ROOT, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, html);
}

/* ---------------- preparar datos ---------------- */
for (const dir of ['veterinarias', 'urgencias-24-horas', 'ficha']) rmSync(path.join(ROOT, dir), { recursive: true, force: true });

const porBarrio = new Map();
for (const r of data) { const b = barrioDe(r); if (!b) continue; if (!porBarrio.has(b)) porBarrio.set(b, []); porBarrio.get(b).push(r); }
const slugsBarrio = new Map();
for (const b of porBarrio.keys()) { const s = slugify(b); if (slugsBarrio.has(s)) throw new Error('Slug de barrio duplicado: ' + s); slugsBarrio.set(s, b); }
const centro = new Map([...porBarrio].map(([b, rs]) => { const g = rs.filter((r) => typeof r.lat === 'number'); return [b, { lat: g.reduce((a, r) => a + r.lat, 0) / g.length, lng: g.reduce((a, r) => a + r.lng, 0) / g.length }]; }));
const vecinos = (b, n = 6) => [...centro.keys()].filter((x) => x !== b).map((x) => [x, km(centro.get(b), centro.get(x))]).sort((a, c) => a[1] - c[1]).slice(0, n).map(([x]) => x);
const zonaDeBarrio = (b) => porBarrio.get(b)[0].zona;

const urls = [{ loc: SITE + '/', pr: '1.0' }, { loc: SITE + '/recordatorios', pr: '0.7' }, { loc: SITE + '/veterinarias', pr: '0.8' }, { loc: SITE + '/urgencias-24-horas', pr: '0.8' }];
const titulos = new Map();
const checkTitle = (t, u) => { if (titulos.has(t)) throw new Error('Title duplicado: "' + t + '" en ' + u + ' y ' + titulos.get(t)); titulos.set(t, u); };

/* ---------------- páginas de barrio ---------------- */
for (const [b, rs] of porBarrio) {
  const s = slugify(b), url = barrioUrl(b);
  const vets = rs.filter((r) => r.tipo === 'veterinaria').sort(orden);
  const otros = rs.filter((r) => r.tipo !== 'veterinaria').sort(orden);
  const n24 = rs.filter(es24).length;
  const zona = zonaDeBarrio(b);
  const cuenta = Object.entries(rs.reduce((m, r) => (m[r.tipo] = (m[r.tipo] || 0) + 1, m), {})).sort((a, c) => c[1] - a[1]).map(([t, n]) => n + ' ' + (n === 1 ? (TIPO[t] || t).toLowerCase() : TIPO_PL[t])).join(', ');
  const top = vets.filter((r) => +r.rating > 0)[0];

  const h1 = vets.length ? 'Veterinarias en ' + b : 'Servicios para mascotas en ' + b;
  const title = (vets.length ? 'Veterinarias en ' + b : 'Peluquerías y pet shops en ' + b) + (n24 ? ' — urgencias 24 h' : '') + ' | VetBA';
  const desc = (vets.length ? plural(vets.length, 'veterinaria', 'veterinarias') + ' en ' + b : 'Servicios para mascotas en ' + b) + ' (' + zona + ')' + (n24 ? ', ' + n24 + ' con atención 24 horas' : '') + '. Teléfonos, direcciones, horarios y cómo llegar.' + (otros.length ? ' También peluquerías y pet shops.' : '');
  checkTitle(title, url);
  const bc = breadcrumbs([['Inicio', SITE + '/'], ['Veterinarias', SITE + '/veterinarias'], [b, null]]);
  const lista = vets.length ? vets : otros;
  const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', name: h1, numberOfItems: rs.length, itemListElement: [...vets, ...otros].map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: fichaUrl(r), name: r.nombre })) };
  const body = bc.html +
    '<h1>' + esc(h1) + '</h1>' +
    '<p class="lead">En VetBA hay ' + plural(rs.length, 'lugar', 'lugares') + ' para mascotas en ' + esc(b) + ' (' + esc(zona) + '): ' + esc(cuenta) + '.' +
      (n24 ? ' <b>' + plural(n24, 'atiende', 'atienden') + ' las 24 horas.</b>' : '') +
      (top ? ' La mejor calificada en Google es <a href="/ficha/' + esc(top.slug) + '">' + esc(top.nombre) + '</a> (' + nf1.format(top.rating) + ' ★, ' + nf0.format(top['reseñas'] || 0) + ' reseñas).' : '') +
      ' Llamá antes de ir para confirmar horario.</p>' +
    (n24 ? '<p><a class="b urg big" href="/urgencias-24-horas/' + ZONA_SLUG(zona) + '">Ver urgencias 24 h en ' + esc(zona) + '</a></p>' : '') +
    '<div class="cards">' + lista.map((r) => card(r, 'barrio')).join('') + '</div>' +
    (vets.length && otros.length ? '<h2>Peluquerías, pet shops y laboratorios en ' + esc(b) + '</h2><div class="cards">' + otros.map((r) => card(r, 'barrio')).join('') + '</div>' : '') +
    '<h2>Barrios cercanos</h2><div class="links">' + vecinos(b).map((x) => '<a href="/veterinarias/' + slugify(x) + '">Veterinarias en ' + esc(x) + '</a>').join('') + '</div>' +
    '<div class="box"><b>¿Tenés una veterinaria en ' + esc(b) + '?</b> <a href="' + esc(waLink(WHATSAPP_CONTACTO, 'Hola VetBA, tengo un negocio en ' + b + ' y quiero sumarlo o reclamar mi ficha.')) + '" target="_blank" rel="noopener">Sumala o reclamá tu ficha gratis</a>.</div>';
  write('veterinarias/' + s + '/index.html', page({ title, desc, canonical: url, body, jsonld: [bc.ld, itemList] }));
  urls.push({ loc: url, pr: '0.8' });
}

/* ---------------- índice de barrios ---------------- */
{
  const url = SITE + '/veterinarias';
  const bc = breadcrumbs([['Inicio', SITE + '/'], ['Veterinarias por barrio', null]]);
  const porZona = {};
  for (const b of [...porBarrio.keys()].sort((a, c) => a.localeCompare(c, 'es'))) (porZona[zonaDeBarrio(b)] = porZona[zonaDeBarrio(b)] || []).push(b);
  const body = bc.html + '<h1>Veterinarias por barrio en CABA y GBA</h1><p class="lead">Elegí tu barrio o localidad para ver veterinarias, peluquerías y pet shops con teléfono, dirección y cómo llegar.</p>' +
    Object.keys(porZona).sort().map((z) => '<h2>' + esc(z) + '</h2><div class="links">' + porZona[z].map((b) => '<a href="/veterinarias/' + slugify(b) + '">' + esc(b) + ' (' + porBarrio.get(b).length + ')</a>').join('') + '</div>').join('');
  write('veterinarias/index.html', page({ title: 'Veterinarias por barrio en CABA y GBA | VetBA', desc: 'Listado de veterinarias por barrio y localidad de CABA y GBA: ' + porBarrio.size + ' barrios con teléfono, dirección y horarios.', canonical: url, body, jsonld: [bc.ld] }));
}

/* ---------------- urgencias 24 h por zona ---------------- */
const zonas24 = {};
for (const r of data.filter(es24)) (zonas24[r.zona] = zonas24[r.zona] || []).push(r);
for (const [z, rs] of Object.entries(zonas24)) {
  const s = ZONA_SLUG(z), url = SITE + '/urgencias-24-horas/' + s;
  rs.sort((a, c) => score(c) - score(a));
  const title = 'Veterinarias 24 horas en ' + z + ' — urgencias | VetBA';
  checkTitle(title, url);
  const bc = breadcrumbs([['Inicio', SITE + '/'], ['Urgencias 24 horas', SITE + '/urgencias-24-horas'], [z, null]]);
  const barrios = [...new Set(rs.map(barrioDe).filter(Boolean))];
  const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Veterinarias 24 horas en ' + z, numberOfItems: rs.length, itemListElement: rs.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: fichaUrl(r), name: r.nombre })) };
  const otras = Object.keys(zonas24).filter((x) => x !== z);
  const body = bc.html + '<h1>Veterinarias 24 horas en ' + esc(z) + '</h1>' +
    '<p class="lead">' + plural(rs.length, 'veterinaria atiende', 'veterinarias atienden') + ' las 24 horas en ' + esc(z) + (barrios.length ? ' (' + esc(barrios.join(', ')) + ')' : '') + '. <b>Llamá antes de ir para confirmar disponibilidad.</b></p>' +
    '<p><a class="b urg big" href="/?urgencia=1">Ordenar por cercanía a mi ubicación</a></p>' +
    '<div class="cards">' + rs.map((r) => card(r, 'urgencias')).join('') + '</div>' +
    (otras.length ? '<h2>Urgencias 24 horas en otras zonas</h2><div class="links">' + otras.map((x) => '<a href="/urgencias-24-horas/' + ZONA_SLUG(x) + '">' + esc(x) + ' (' + zonas24[x].length + ')</a>').join('') + '</div>' : '') +
    '<h2>Veterinarias por barrio</h2><div class="links">' + barrios.map((b) => '<a href="/veterinarias/' + slugify(b) + '">' + esc(b) + '</a>').join('') + '</div>';
  write('urgencias-24-horas/' + s + '/index.html', page({ title, desc: plural(rs.length, 'veterinaria 24 horas', 'veterinarias 24 horas') + ' en ' + z + ' para urgencias: teléfono, dirección y cómo llegar. Llamá antes de ir.', canonical: url, body, jsonld: [bc.ld, itemList] }));
  urls.push({ loc: url, pr: '0.9' });
}
{
  const url = SITE + '/urgencias-24-horas';
  const bc = breadcrumbs([['Inicio', SITE + '/'], ['Urgencias 24 horas', null]]);
  const total = data.filter(es24).length;
  const body = bc.html + '<h1>Veterinarias 24 horas para urgencias en CABA y GBA</h1><p class="lead">' + plural(total, 'veterinaria atiende', 'veterinarias atienden') + ' las 24 horas en VetBA. Elegí tu zona o usá el modo urgencia para ordenarlas por distancia.</p>' +
    '<p><a class="b urg big" href="/?urgencia=1">Urgencia: veterinaria abierta ahora</a></p><div class="links">' +
    Object.entries(zonas24).map(([z, rs]) => '<a href="/urgencias-24-horas/' + ZONA_SLUG(z) + '">' + esc(z) + ' (' + rs.length + ')</a>').join('') + '</div>';
  write('urgencias-24-horas/index.html', page({ title: 'Veterinarias 24 horas en CABA y GBA — urgencias | VetBA', desc: total + ' veterinarias de urgencia 24 horas en CABA y GBA con teléfono y cómo llegar.', canonical: url, body, jsonld: [bc.ld] }));
}

/* ---------------- fichas ---------------- */
const PREC = { consulta: 'Consulta', antirrabica: 'Vacuna antirrábica', castracion_gato: 'Castración gato', castracion_perro: 'Castración perro' };
const ARR = (a) => (Array.isArray(a) ? a : []);
for (const r of data) {
  const b = barrioDe(r), url = fichaUrl(r);
  const lugar = b || r.zona;
  let title = r.nombre + ' — ' + (TIPO[r.tipo] || r.tipo) + ' en ' + lugar + ' | VetBA';
  if (titulos.has(title)) title = r.nombre + ' (' + r.direccion + ') — ' + (TIPO[r.tipo] || r.tipo) + ' en ' + lugar + ' | VetBA';
  checkTitle(title, url);
  const desc = r.nombre + ': ' + (TIPO[r.tipo] || r.tipo).toLowerCase() + ' en ' + r.direccion + ', ' + lugar + '.' + (es24(r) ? ' Atiende 24 horas.' : '') + (r.telefono ? ' Teléfono ' + r.telefono + ',' : '') + ' horario y cómo llegar.' + (+r.rating > 0 ? ' ' + nf1.format(r.rating) + ' ★ en Google.' : '');
  const bc = breadcrumbs(b ? [['Inicio', SITE + '/'], ['Veterinarias en ' + b, barrioUrl(b)], [r.nombre, null]] : [['Inicio', SITE + '/'], ['Veterinarias', SITE + '/veterinarias'], [r.nombre, null]]);
  const p = r.precios && typeof r.precios === 'object' ? r.precios : null;
  const f = p && /^(\d{4})-(\d{2})-(\d{2})$/.exec(p.fecha_actualizacion || '');
  const filasPrecio = p ? Object.keys(PREC).filter((k) => typeof p[k] === 'number').map((k) => '<tr><td>' + PREC[k] + '</td><td>$' + nf0.format(p[k]) + '</td></tr>').join('') : '';
  const cerca = (b ? porBarrio.get(b) : data.filter((x) => x.zona === r.zona)).filter((x) => x.id !== r.id).map((x) => [x, km(r, x)]).sort((a, c) => a[1] - c[1]).slice(0, 4).map(([x]) => x);
  const chips = (arr, fn) => arr.map((x) => '<span class="tag">' + esc(fn(x)) + '</span>').join('');
  const lab = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
  const osm = typeof r.lat === 'number' ? 'https://www.openstreetmap.org/export/embed.html?bbox=' + (r.lng - 0.006) + '%2C' + (r.lat - 0.004) + '%2C' + (r.lng + 0.006) + '%2C' + (r.lat + 0.004) + '&layer=mapnik&marker=' + r.lat + '%2C' + r.lng : '';
  const claim = 'Hola VetBA, soy el dueño/encargado de "' + r.nombre + '" (ficha #' + r.id + ', ' + r.slug + ') y quiero reclamar la ficha.';
  const body = bc.html +
    '<h1>' + esc(r.nombre) + '</h1>' +
    '<div class="tags"><span class="tag">' + esc(TIPO[r.tipo] || r.tipo) + '</span>' + (esPago(r) ? '<span class="tag">✓ Verificado</span>' : '') + '</div>' +
    '<p class="lead" style="margin-top:10px">' + esc(TIPO[r.tipo] || r.tipo) + ' en <b>' + esc(r.direccion) + '</b>' + (b ? ', ' + esc(b) : '') + ' (' + esc(r.zona) + ').' +
      (r.telefono ? ' Teléfono: <a href="tel:' + e164(r.telefono) + '" data-track="Llamar" data-id="' + r.id + '" data-slug="' + esc(r.slug) + '" data-origen="ficha-seo">' + esc(r.telefono) + '</a>.' : '') +
      (+r.rating > 0 ? ' Calificación en Google: <b>' + nf1.format(r.rating) + ' ★</b> (' + nf0.format(r['reseñas'] || 0) + ' reseñas).' : '') + '</p>' +
    actions(r, 'ficha-seo') +
    '<div class="box"><b>Horario</b><br>' + horarioHTML(r) +
      (!r.horarios && r.horario && !/horario comercial/i.test(r.horario) ? '<p class="note">Referencia de Google sin días especificados: ' + esc(r.horario) + '. Confirmalo por teléfono.</p>' : '') + '</div>' +
    (ARR(r.servicios).length ? '<h2>Servicios</h2><div class="tags">' + chips(ARR(r.servicios), servLabel) + '</div>' : '') +
    (ARR(r.especialidades).length ? '<h2>Especialidades</h2><div class="tags">' + chips(ARR(r.especialidades), lab) + '</div>' : '') +
    (r.a_domicilio === true || r.exoticos === true ? '<div class="tags" style="margin-top:10px">' + (r.a_domicilio === true ? '<span class="tag">Atención a domicilio</span>' : '') + (r.exoticos === true ? '<span class="tag">Animales exóticos</span>' : '') + '</div>' : '') +
    (ARR(r.medios_pago).length ? '<h2>Medios de pago</h2><div class="tags">' + chips(ARR(r.medios_pago), lab) + '</div>' : '') +
    (filasPrecio && f ? '<h2>Precios de referencia</h2><table class="prices">' + filasPrecio + '</table><p class="note">Precio informado por el establecimiento el ' + f[3] + '/' + f[2] + '/' + f[1] + '. Consultá antes de ir.</p>' : '') +
    (osm ? '<h2>Ubicación</h2><iframe class="map" loading="lazy" title="Mapa de ' + esc(r.nombre) + '" src="' + osm + '"></iframe>' : '') +
    (cerca.length ? '<h2>' + (b ? 'Otros lugares en ' + esc(b) : 'Otros lugares cerca') + '</h2><div class="cards">' + cerca.map((x) => card(x, 'ficha-relacionada')).join('') + '</div>' : '') +
    '<div class="box"><b>¿Sos el dueño?</b> Reclamá esta ficha gratis para corregir datos, sumar WhatsApp y horarios.<div class="acts" style="max-width:360px"><a class="b dark" href="' + esc(waLink(WHATSAPP_CONTACTO, claim)) + '" target="_blank" rel="noopener" data-track="Reclamar ficha" data-id="' + r.id + '" data-slug="' + esc(r.slug) + '" data-origen="ficha-seo">Reclamá esta ficha</a></div></div>' +
    (b ? '<p><a href="/veterinarias/' + slugify(b) + '">Ver todas las veterinarias en ' + esc(b) + '</a></p>' : '');
  write('ficha/' + r.slug + '/index.html', page({ title, desc, canonical: url, body, jsonld: [bc.ld, businessLD(r)] }));
  urls.push({ loc: url, pr: '0.6' });
}

/* ---------------- sitemap y robots ---------------- */
writeFileSync(path.join(ROOT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => '<url><loc>' + u.loc + '</loc><lastmod>' + HOY + '</lastmod><priority>' + u.pr + '</priority></url>').join('\n') + '\n</urlset>\n');
writeFileSync(path.join(ROOT, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /scripts/\n\nSitemap: ' + SITE + '/sitemap.xml\n');

const nB = porBarrio.size, nZ = Object.keys(zonas24).length, nF = data.length;
console.log(`Páginas generadas: ${nB} barrios + ${nZ} zonas de urgencia + ${nF} fichas + 2 índices = ${nB + nZ + nF + 2}`);
console.log(`sitemap.xml: ${urls.length} URLs`);
const sinBarrio = data.filter((r) => !barrioDe(r)).length;
if (sinBarrio) console.log(`Aviso: ${sinBarrio} registros sin barrio (tienen ficha, pero no aparecen en páginas de barrio). Ver: node scripts/normalizar-data.mjs --check`);
