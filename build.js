const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://vetba.com.ar';

// ---------- helpers ----------
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function slugify(s){return String(s||'').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
function jsonld(obj){return '<script type="application/ld+json">'+JSON.stringify(obj)+'<\/script>';}

// telefono '011 4567-8901' -> tel: y wa.me
function digits(t){return String(t||'').replace(/\D/g,'');}
function telHref(t){var d=digits(t); return d?('tel:+54'+d.replace(/^0/,'')):'';}
function waHref(t){var d=digits(t).replace(/^0/,''); if(!d) return ''; return 'https://wa.me/549'+d;}

var TIPO_LABEL={veterinaria:'Veterinaria',petshop:'Pet Shop',peluqueria:'Peluqueria',laboratorio:'Laboratorio',ecografia:'Ecografia'};
var SERV_LABEL={consultas:'Consultas',vacunacion:'Vacunacion','24hs':'24 horas',urgencias:'Urgencias',internacion:'Internacion',cirugias:'Cirugias',cirugia:'Cirugia',petshop:'Pet shop',alimentos:'Alimentos',accesorios:'Accesorios',peluqueria:'Peluqueria',bano:'Bano',ecografia:'Ecografia',laboratorio:'Laboratorio',analisis:'Analisis'};
function servLabel(s){return SERV_LABEL[s]||(s.charAt(0).toUpperCase()+s.slice(1));}

// ---------- horario -> openingHours (schema) ----------
function openingHours(h){
  if(!h) return null;
  var t=String(h).toLowerCase();
  if(t.indexOf('24')>-1) return 'Mo-Su 00:00-23:59';
  return null; // si no es 24hs, no inventamos horarios precisos
}

// ---------- design / layout ----------
var CSS = [
':root{--brand:#0891B2;--brand-dark:#0E7490;--accent:#059669;--coral:#FF6B5B;--amber:#F59E0B;--ink:#0F172A;--ink-soft:#475569;--ink-mute:#94A3B8;--bg:#F8FAFC;--surface:#FFFFFF;--border:#E2E8F0;--line:#F1F5F9}',
'*{box-sizing:border-box}',
'body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.55}',
'a{color:var(--brand-dark);text-decoration:none}a:hover{text-decoration:underline}',
'header.top{background:#fff;border-bottom:1px solid var(--border);padding:14px 20px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:5}',
'header.top a.logo{font-weight:800;font-size:20px;color:var(--brand-dark);letter-spacing:-.5px}',
'header.top .tag{font-size:12px;color:var(--ink-mute);margin-left:auto}',
'.wrap{max-width:960px;margin:0 auto;padding:24px 20px 64px}',
'nav.bc{font-size:13px;color:var(--ink-mute);margin-bottom:16px}',
'nav.bc a{color:var(--ink-soft)}',
'h1{font-size:28px;line-height:1.2;margin:0 0 8px}',
'.lead{color:var(--ink-soft);margin:0 0 24px;font-size:15px;max-width:70ch}',
'.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px 20px;margin-bottom:14px}',
'.card h2{font-size:19px;margin:0 0 4px}.card h2 a{color:var(--ink)}',
'.card .dir,.card .meta{margin:3px 0;font-size:14px;color:var(--ink-soft)}',
'.badge{display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;color:var(--brand-dark);background:#ECFEFF;border:1px solid #CFFAFE;border-radius:999px;padding:2px 9px;margin-bottom:6px}',
'.rating{color:var(--amber);font-weight:700}',
'.rating .rc{color:var(--ink-mute);font-weight:400}',
'.servs{margin:12px 0;display:flex;flex-wrap:wrap;gap:6px}',
'.serv{font-size:12px;background:var(--line);border:1px solid var(--border);border-radius:8px;padding:3px 9px;color:var(--ink-soft)}',
'.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}',
'.btn{display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:600;border-radius:10px;padding:9px 14px;border:1px solid var(--border);background:#fff;color:var(--ink)}',
'.btn:hover{text-decoration:none}',
'.btn.call{background:var(--brand);border-color:var(--brand);color:#fff}',
'.btn.wa{background:#25D366;border-color:#25D366;color:#fff}',
'.btn.map{background:#fff}',
'.grid-links{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 28px}',
'.chip{font-size:14px;background:#fff;border:1px solid var(--border);border-radius:999px;padding:7px 14px;color:var(--brand-dark);font-weight:600}',
'.mapbox{margin-top:16px;border-radius:12px;overflow:hidden;border:1px solid var(--border)}',
'.mapbox iframe{display:block;width:100%;height:300px;border:0}',
'.sec-title{font-size:14px;text-transform:uppercase;letter-spacing:.4px;color:var(--ink-mute);margin:28px 0 10px;font-weight:700}',
'footer.ft{border-top:1px solid var(--border);background:#fff;padding:28px 20px;color:var(--ink-mute);font-size:13px;text-align:center}',
'footer.ft a{color:var(--ink-soft)}'
].join('\n');

// ---------- page shell ----------
function page(opts){
  // opts: title, desc, canonical, bodyHtml, jsonldArr, extraHead
  var head = [];
  head.push('<!DOCTYPE html>');
  head.push('<html lang="es">');
  head.push('<head>');
  head.push('<meta charset="utf-8">');
  head.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
  head.push('<title>'+esc(opts.title)+'</title>');
  head.push('<meta name="description" content="'+esc(opts.desc)+'">');
  head.push('<link rel="canonical" href="'+opts.canonical+'">');
  head.push('<meta property="og:type" content="website">');
  head.push('<meta property="og:title" content="'+esc(opts.title)+'">');
  head.push('<meta property="og:description" content="'+esc(opts.desc)+'">');
  head.push('<meta property="og:url" content="'+opts.canonical+'">');
  head.push('<meta property="og:image" content="'+SITE+'/og.png">');
  head.push('<meta name="twitter:card" content="summary_large_image">');
  head.push('<link rel="icon" href="/favicon.png">');
  head.push('<style>'+CSS+'</style>');
  (opts.jsonldArr||[]).forEach(function(o){ head.push(jsonld(o)); });
  head.push('</head>');
  head.push('<body>');
  head.push('<header class="top"><a class="logo" href="/">VetBA</a><span class="tag">Veterinarias y servicios para mascotas en Buenos Aires</span></header>');
  head.push('<main class="wrap">');
  head.push(opts.bodyHtml);
  head.push('</main>');
  head.push('<footer class="ft">VetBA &middot; Directorio de veterinarias y servicios para mascotas en Buenos Aires. <a href="/">Volver al inicio</a></footer>');
  head.push('</body></html>');
  return head.join('\n');
}

// ---------- load data ----------
var raw = fs.readFileSync(path.join(ROOT,'data.json'),'utf8');
var data = JSON.parse(raw);
if(!Array.isArray(data)){ throw new Error('data.json no es un array'); }

// localidades 'basura' que NO son barrios reales (codigos postales, siglas, genericos)
function isRealBarrio(loc){
  if(!loc) return false;
  var s=String(loc).trim();
  if(/^[A-Z]{2,4}$/.test(s)) return false;        // siglas tipo AAH, BOD
  if(/^C\d/.test(s)) return false;                // codigos postales C1206AAB
  if(s==='Buenos Aires') return false;
  if(s==='Cdad. Autonoma de Buenos Aires') return false;
  if(/^Cdad\.?\s*Aut/i.test(s)) return false;
  return true;
}

// zona slug fijo
var ZONA_SLUG={'CABA':'caba','GBA Norte':'gba-norte','GBA Sur':'gba-sur','GBA Oeste':'gba-oeste'};
function zonaSlug(z){ return ZONA_SLUG[z]||slugify(z); }

// indices
var byBarrio={}, byZona={};
data.forEach(function(p){
  p._tipoLabel=TIPO_LABEL[p.tipo]||'Lugar';
  p._barrioOk=isRealBarrio(p.localidad);
  if(p._barrioOk){ (byBarrio[p.localidad]=byBarrio[p.localidad]||[]).push(p); }
  if(p.zona){ (byZona[p.zona]=byZona[p.zona]||[]).push(p); }
});

// ---------- schema LocalBusiness ----------
function bizType(tipo){ return tipo==='veterinaria' ? 'VeterinaryCare' : 'LocalBusiness'; }
function localBusinessLD(p){
  var url=SITE+'/lugar/'+p.slug;
  var o={
    '@context':'https://schema.org',
    '@type':bizType(p.tipo),
    'name':p.nombre,
    'url':url,
    'address':{'@type':'PostalAddress','streetAddress':p.direccion||'','addressLocality':p.localidad||'','addressRegion':p.zona||'AMBA','addressCountry':'AR'}
  };
  if(p.telefono) o.telephone=p.telefono;
  if(typeof p.lat==='number' && typeof p.lng==='number'){ o.geo={'@type':'GeoCoordinates','latitude':p.lat,'longitude':p.lng}; }
  if(p.rating && p['rese\u00f1as']){ o.aggregateRating={'@type':'AggregateRating','ratingValue':p.rating,'reviewCount':p['rese\u00f1as']}; }
  var oh=openingHours(p.horario); if(oh) o.openingHours=oh;
  o.image=SITE+'/og.png';
  return o;
}
function breadcrumbLD(items){
  return {'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':items.map(function(it,i){return {'@type':'ListItem','position':i+1,'name':it.name,'item':it.url};})};
}

// ---------- ficha individual /lugar/{slug} ----------
function reviews(p){ return p['rese\u00f1as']||0; }
function ratingHtml(p){
  if(!p.rating) return '';
  return '<span class="rating">\u2b50 '+p.rating+' <span class="rc">('+reviews(p)+' rese\u00f1as)</span></span>';
}
function mapEmbed(p){
  if(typeof p.lat!=='number'||typeof p.lng!=='number') return '';
  var d=0.004;
  var bbox=(p.lng-d)+','+(p.lat-d)+','+(p.lng+d)+','+(p.lat+d);
  var src='https://www.openstreetmap.org/export/embed.html?bbox='+encodeURIComponent(bbox)+'&layer=mapnik&marker='+p.lat+','+p.lng;
  return '<div class="mapbox"><iframe loading="lazy" title="Mapa" src="'+src+'"></iframe></div>';
}
function buildFicha(p){
  var canonical=SITE+'/lugar/'+p.slug;
  var barrioTxt = p._barrioOk ? p.localidad : (p.zona||'Buenos Aires');
  var title=p.nombre+' \u2014 '+p._tipoLabel+(p._barrioOk?(' en '+p.localidad):'')+' | VetBA';
  var desc=p._tipoLabel+' '+p.nombre+(p.direccion?(', '+p.direccion):'')+(p._barrioOk?(' ('+p.localidad+')'):'')+'. Tel\u00e9fono, horarios, servicios y mapa.';
  var crumbs=[{name:'Inicio',url:SITE+'/'}];
  if(p._barrioOk){ crumbs.push({name:'Veterinarias en '+p.localidad,url:SITE+'/veterinarias-'+slugify(p.localidad)}); }
  crumbs.push({name:p.nombre,url:canonical});
  var bcHtml='<nav class="bc">'+crumbs.map(function(c,i){ return i<crumbs.length-1?('<a href="'+c.url+'">'+esc(c.name)+'</a> &rsaquo; '):esc(c.name); }).join('')+'</nav>';
  var servs=(p.servicios||[]).map(function(s){return '<span class="serv">'+esc(servLabel(s))+'</span>';}).join('');
  var b=[];
  b.push(bcHtml);
  b.push('<span class="badge">'+esc(p._tipoLabel)+'</span>');
  b.push('<h1>'+esc(p.nombre)+'</h1>');
  b.push('<p class="lead">'+esc(p._tipoLabel)+(p.direccion?(' en '+esc(p.direccion)):'')+(p._barrioOk?(', '+esc(p.localidad)):'')+'.</p>');
  b.push('<div class="card">');
  if(p.direccion) b.push('<p class="dir">\ud83d\udccd '+esc(p.direccion)+(p._barrioOk?(', '+esc(p.localidad)):'')+'</p>');
  if(p.horario) b.push('<p class="meta">\ud83d\udd52 '+esc(p.horario)+'</p>');
  if(p.rating) b.push('<p class="meta">'+ratingHtml(p)+'</p>');
  if(p.telefono) b.push('<p class="meta">\ud83d\udcde '+esc(p.telefono)+'</p>');
  if(servs) b.push('<div class="servs">'+servs+'</div>');
  var acts=[];
  if(p.telefono){ acts.push('<a class="btn call" href="'+telHref(p.telefono)+'">\ud83d\udcde Llamar</a>'); }
  if(p.telefono){ acts.push('<a class="btn wa" target="_blank" rel="noopener" href="'+waHref(p.telefono)+'">WhatsApp</a>'); }
  if(typeof p.lat==='number'){ acts.push('<a class="btn map" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query='+p.lat+','+p.lng+'">\ud83d\uddfa\ufe0f C\u00f3mo llegar</a>'); }
  if(acts.length) b.push('<div class="actions">'+acts.join('')+'</div>');
  b.push('</div>');
  b.push(mapEmbed(p));
  if(p._barrioOk){ b.push('<p style="margin-top:24px"><a href="/veterinarias-'+slugify(p.localidad)+'">&larr; Ver m\u00e1s veterinarias en '+esc(p.localidad)+'</a></p>'); }
  var ld=[localBusinessLD(p), breadcrumbLD(crumbs)];
  return page({title:title,desc:desc,canonical:canonical,bodyHtml:b.join('\n'),jsonldArr:ld});
}

// ---------- tarjeta de listado (barrio/zona) ----------
function listCard(p){
  var url='/lugar/'+p.slug;
  var servs=(p.servicios||[]).slice(0,6).map(function(s){return '<span class="serv">'+esc(servLabel(s))+'</span>';}).join('');
  var b=[];
  b.push('<article class="card">');
  b.push('<span class="badge">'+esc(p._tipoLabel)+'</span>');
  b.push('<h2><a href="'+url+'">'+esc(p.nombre)+'</a></h2>');
  if(p.direccion) b.push('<p class="dir">\ud83d\udccd '+esc(p.direccion)+(p._barrioOk?(', '+esc(p.localidad)):'')+'</p>');
  var metaBits=[];
  if(p.horario) metaBits.push('\ud83d\udd52 '+esc(p.horario));
  b.push('<p class="meta">'+metaBits.join(' &middot; ')+' '+ratingHtml(p)+'</p>');
  if(servs) b.push('<div class="servs">'+servs+'</div>');
  var acts=[];
  acts.push('<a class="btn call" href="'+url+'">Ver ficha</a>');
  if(p.telefono) acts.push('<a class="btn map" href="'+telHref(p.telefono)+'">\ud83d\udcde Llamar</a>');
  b.push('<div class="actions">'+acts.join('')+'</div>');
  b.push('</article>');
  return b.join('\n');
}

// ---------- ItemList LD para barrio/zona ----------
function itemListLD(name,list){
  return {'@context':'https://schema.org','@type':'ItemList','name':name,'itemListElement':list.map(function(p,i){var it=localBusinessLD(p); return {'@type':'ListItem','position':i+1,'item':it};})};
}

// ---------- pagina de barrio /veterinarias-{barrio} ----------
function buildBarrio(barrio,list){
  var bslug=slugify(barrio);
  var canonical=SITE+'/veterinarias-'+bslug;
  var n=list.length;
  var vets=list.filter(function(p){return p.tipo==='veterinaria';}).length;
  var title='Veterinarias en '+barrio+' \u2014 direcciones, horarios y contacto | VetBA';
  var desc='Encontr\u00e1 veterinarias en '+barrio+': '+n+' lugares verificados con direcci\u00f3n, tel\u00e9fono, horarios y servicios (urgencias 24hs, vacunaci\u00f3n, peluquer\u00eda y m\u00e1s). Directorio gratuito VetBA.';
  var crumbs=[{name:'Inicio',url:SITE+'/'},{name:'Veterinarias en '+barrio,url:canonical}];
  var bcHtml='<nav class="bc"><a href="/">Inicio</a> &rsaquo; Veterinarias en '+esc(barrio)+'</nav>';
  var b=[];
  b.push(bcHtml);
  b.push('<h1>Veterinarias en '+esc(barrio)+'</h1>');
  b.push('<p class="lead">'+n+' lugares verificados en '+esc(barrio)+'. Consult\u00e1 direcciones, horarios, tel\u00e9fonos y servicios disponibles: urgencias 24hs, vacunaci\u00f3n, cirug\u00eda, peluquer\u00eda y m\u00e1s. Tocá cada lugar para ver su ficha completa con mapa y bot\u00f3n de contacto.</p>');
  list.slice().sort(function(a,b){return (b.rating||0)-(a.rating||0);}).forEach(function(p){ b.push(listCard(p)); });
  var ld=[itemListLD('Veterinarias en '+barrio,list), breadcrumbLD(crumbs)];
  return page({title:title,desc:desc,canonical:canonical,bodyHtml:b.join('\n'),jsonldArr:ld});
}

// ---------- pagina de zona /zona/{zona} ----------
function buildZona(zona,list){
  var zslug=zonaSlug(zona);
  var canonical=SITE+'/zona/'+zslug;
  var n=list.length;
  var title='Veterinarias en '+zona+' \u2014 directorio por barrio | VetBA';
  var desc='Veterinarias y servicios para mascotas en '+zona+': '+n+' lugares verificados con tel\u00e9fono, horarios y mapa. Encontr\u00e1 urgencias 24hs cerca tuyo. Directorio gratuito VetBA.';
  var crumbs=[{name:'Inicio',url:SITE+'/'},{name:zona,url:canonical}];
  var b=[];
  b.push('<nav class="bc"><a href="/">Inicio</a> &rsaquo; '+esc(zona)+'</nav>');
  b.push('<h1>Veterinarias en '+esc(zona)+'</h1>');
  b.push('<p class="lead">'+n+' lugares verificados en '+esc(zona)+'. Explor\u00e1 por barrio o mir\u00e1 el listado completo con direcciones, tel\u00e9fonos y servicios.</p>');
  // barrios de esta zona
  var barrios={};
  list.forEach(function(p){ if(p._barrioOk){ (barrios[p.localidad]=barrios[p.localidad]||0); barrios[p.localidad]++; } });
  var bnames=Object.keys(barrios).sort();
  if(bnames.length){
    b.push('<div class="sec-title">Barrios en '+esc(zona)+'</div>');
    b.push('<div class="grid-links">'+bnames.map(function(bn){return '<a class="chip" href="/veterinarias-'+slugify(bn)+'">'+esc(bn)+' ('+barrios[bn]+')</a>';}).join('')+'</div>');
  }
  b.push('<div class="sec-title">Todos los lugares en '+esc(zona)+'</div>');
  list.slice().sort(function(a,b){return (b.rating||0)-(a.rating||0);}).forEach(function(p){ b.push(listCard(p)); });
  var ld=[itemListLD('Veterinarias en '+zona,list), breadcrumbLD(crumbs)];
  return page({title:title,desc:desc,canonical:canonical,bodyHtml:b.join('\n'),jsonldArr:ld});
}

// ---------- escribir archivos ----------
function ensureDir(d){ if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); }
function write(rel,content){ var f=path.join(ROOT,rel); ensureDir(path.dirname(f)); fs.writeFileSync(f,content,'utf8'); }

var urls=[]; // para sitemap
function addUrl(u){ urls.push(u); }

addUrl(SITE+'/');

// 1) fichas individuales
var fichaCount=0;
data.forEach(function(p){
  if(!p.slug){ return; }
  write('lugar/'+p.slug+'.html', buildFicha(p));
  addUrl(SITE+'/lugar/'+p.slug);
  fichaCount++;
});

// 2) paginas de barrio
var barrioCount=0;
Object.keys(byBarrio).sort().forEach(function(barrio){
  var list=byBarrio[barrio];
  write('veterinarias-'+slugify(barrio)+'.html', buildBarrio(barrio,list));
  addUrl(SITE+'/veterinarias-'+slugify(barrio));
  barrioCount++;
});

// 3) paginas de zona
var zonaCount=0;
Object.keys(byZona).sort().forEach(function(zona){
  var list=byZona[zona];
  write('zona/'+zonaSlug(zona)+'.html', buildZona(zona,list));
  addUrl(SITE+'/zona/'+zonaSlug(zona));
  zonaCount++;
});

// 4) sitemap.xml
var today=new Date().toISOString().slice(0,10);
var sm=['<?xml version="1.0" encoding="UTF-8"?>'];
sm.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
urls.forEach(function(u){
  sm.push('<url><loc>'+u+'</loc><lastmod>'+today+'</lastmod></url>');
});
sm.push('</urlset>');
write('sitemap.xml', sm.join('\n'));

// 5) robots.txt
write('robots.txt', 'User-agent: *\nAllow: /\n\nSitemap: '+SITE+'/sitemap.xml\n');

// ---------- log ----------
console.log('VetBA build OK');
console.log('  fichas /lugar/:    '+fichaCount);
console.log('  barrios:           '+barrioCount);
console.log('  zonas:             '+zonaCount);
console.log('  urls en sitemap:   '+urls.length);
