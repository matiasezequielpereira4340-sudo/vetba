// VetBA — funciones compartidas para validar, unir y reportar datos (sin dependencias).
import { readFileSync, writeFileSync } from 'node:fs';

export const slugify = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, ' y ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const barrioDe = (r) => (r.barrio !== undefined ? r.barrio : r.localidad) || null;

export function leerJSON(p) { return JSON.parse(readFileSync(p, 'utf8')); }
// Un registro por línea: diffs legibles y archivo liviano.
export function escribirData(p, data) { writeFileSync(p, '[\n' + data.map((r) => JSON.stringify(r)).join(',\n') + '\n]\n'); }

export function metros(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* ------------------------------------------------------------------
   Teléfonos argentinos -> E.164
   Número nacional significativo = 10 dígitos (característica + abonado),
   sin el 0 de larga distancia ni el 15 de celular.
   Celular SOLO si el número lo dice explícitamente (+54 9 … o … 15 …).
   ------------------------------------------------------------------ */
export function normalizarTelefono(raw) {
  const s = String(raw || '').trim();
  if (!s) return { valido: false, motivo: 'vacío' };
  let d = s.replace(/\D/g, '');
  let movil = false;
  if (s.startsWith('+') || d.startsWith('54')) { if (!d.startsWith('54')) return { valido: false, motivo: 'código de país distinto de +54' }; d = d.slice(2); }
  else if (d.startsWith('0')) d = d.slice(1);
  if (d.startsWith('9') && d.length === 11) { movil = true; d = d.slice(1); }
  if (d.length === 12) {
    for (const a of [2, 3, 4]) if (d.slice(a, a + 2) === '15') { d = d.slice(0, a) + d.slice(a + 2); movil = true; break; }
  }
  if (d.length !== 10) return { valido: false, motivo: d.length + ' dígitos nacionales (se esperan 10)' };
  if (!/^[123]/.test(d)) return { valido: false, motivo: 'característica inválida (' + d.slice(0, 2) + ')' };
  return { valido: true, e164: '+54' + (movil ? '9' : '') + d, movil };
}

/* ------------------------------------------------------------------
   Clasificación de tipo
   (a) tags de OSM, (b) palabras del nombre. Si el nombre mezcla rubros y
   uno es veterinaria -> veterinaria y el resto va a `servicios`.
   ------------------------------------------------------------------ */
export function tipoPorTagsOSM(tags) {
  if (!tags) return null;
  if (tags.amenity === 'veterinary') return 'veterinaria';
  if (tags.shop === 'pet_grooming') return 'peluqueria';
  if (tags.shop === 'pet') return 'petshop';
  return null;
}
const RX = {
  laboratorio: /\blaboratorio\b/,
  // "farmacia veterinaria" vende medicamentos: no es una veterinaria.
  veterinaria: /\b(veterinari[ao]s?|veterinary|vet|clinica|hospital|consultorio|dra?\.?)\b/,
  petshop: /\b(pet ?shop|pet ?shopping|pet ?store|market|tienda)\b/,
  peluqueria: /\b(peluqueria|grooming|estetica|spa canino|styling)\b/,
};
export function rubrosPorNombre(nombre) {
  const n = norm(nombre).replace(/farmacia veterinaria/g, 'farmacia');
  return ['laboratorio', 'veterinaria', 'petshop', 'peluqueria'].filter((k) => RX[k].test(n));
}
export function clasificar(r, tagsOSM) {
  const t = tipoPorTagsOSM(tagsOSM);
  if (t) return { tipo: t, regla: 'osm:' + (tagsOSM.amenity ? 'amenity=' + tagsOSM.amenity : 'shop=' + tagsOSM.shop), extras: [] };
  const rub = rubrosPorNombre(r.nombre);
  if (!rub.length) return { tipo: r.tipo, regla: null, extras: [] };
  if (rub.includes('laboratorio')) return { tipo: 'laboratorio', regla: 'nombre:laboratorio', extras: [] };
  if (rub.includes('veterinaria')) return { tipo: 'veterinaria', regla: rub.length > 1 ? 'nombre:mixto->veterinaria' : 'nombre:veterinaria', extras: rub.filter((x) => x !== 'veterinaria') };
  // pet shop + peluquería sin veterinaria: si el tipo actual es uno de los dos se respeta
  const tipo = rub.includes(r.tipo) ? r.tipo : rub[0];
  return { tipo, regla: 'nombre:' + rub.join('+'), extras: rub.filter((x) => x !== tipo) };
}

/* ------------------------------------------------------------------
   Duplicados: < 40 m y nombres parecidos, o mismo teléfono E.164.
   ------------------------------------------------------------------ */
const STOP = new Set(['veterinaria', 'veterinario', 'vet', 'clinica', 'centro', 'pet', 'shop', 'petshop', 'peluqueria', 'canina', 'de', 'la', 'el', 'los', 'las', 'y', 'del', 'san', 'consultorio', 'hospital', 'dr', 'dra', 'store']);
const tokens = (s) => new Set(norm(s).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w)));
export function nombresParecidos(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return norm(a).replace(/\W/g, '') === norm(b).replace(/\W/g, '');
  let inter = 0; for (const x of A) if (B.has(x)) inter++;
  return inter / Math.min(A.size, B.size) >= 0.6;
}
// Devuelve null o { fusionar: bool, motivo }.
//  - < 40 m + nombre parecido + misma dirección (o mismo placeId/osm_id) -> fusionar
//  - < 40 m + nombre parecido pero distinta altura de calle -> revisar (pueden ser 2 locales)
//  - mismo teléfono a < 300 m -> fusionar; más lejos -> revisar (cadena con central común)
const calle = (s) => norm(s).replace(/\b(av|avenida|calle|c)\b\.?/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
export function sonDuplicados(a, b) {
  if ((a.placeId && a.placeId === b.placeId) || (a.osm_id && a.osm_id === b.osm_id)) return { fusionar: true, motivo: 'mismo ' + (a.placeId === b.placeId ? 'placeId' : 'osm_id') };
  const geo = typeof a.lat === 'number' && typeof b.lat === 'number';
  const dist = geo ? metros(a, b) : Infinity;
  const ta = a.telefono_e164 || normalizarTelefono(a.telefono).e164;
  const tb = b.telefono_e164 || normalizarTelefono(b.telefono).e164;
  if (ta && tb && ta === tb) return dist < 300
    ? { fusionar: true, motivo: 'mismo teléfono a ' + Math.round(dist) + ' m' }
    : { fusionar: false, motivo: 'mismo teléfono pero a ' + (dist / 1000).toFixed(1) + ' km (¿sucursales?)' };
  if (dist < 40 && nombresParecidos(a.nombre, b.nombre)) {
    const misma = a.direccion && b.direccion && calle(a.direccion) === calle(b.direccion);
    return misma
      ? { fusionar: true, motivo: 'misma dirección y nombre parecido' }
      : { fusionar: false, motivo: 'a ' + Math.round(dist) + ' m, nombre parecido, distinta dirección (¿2 locales?)' };
  }
  return null;
}
const completitud = (r) => Object.values(r).filter((v) => v !== null && v !== '' && !(Array.isArray(v) && !v.length)).length + (+r['reseñas'] || 0) / 1e6;
// Fusiona conservando el dato más completo. Devuelve el registro que queda.
export function fusionar(a, b) {
  const [keep, drop] = completitud(a) >= completitud(b) ? [a, b] : [b, a];
  const out = { ...keep };
  for (const [k, v] of Object.entries(drop)) {
    if (['id', 'slug', 'slugs_anteriores', 'ids_fusionados'].includes(k)) continue;
    const cur = out[k];
    if (cur === undefined || cur === null || cur === '') out[k] = v;
    else if (Array.isArray(cur) && Array.isArray(v)) out[k] = [...new Set([...cur, ...v])];
  }
  // Un teléfono distinto no se pierde: queda como alternativo.
  if (drop.telefono && keep.telefono && normalizarTelefono(drop.telefono).e164 !== normalizarTelefono(keep.telefono).e164) {
    out.telefonos_alternativos = [...new Set([...(keep.telefonos_alternativos || []), drop.telefono, ...(drop.telefonos_alternativos || [])])];
  }
  out.ids_fusionados =[...new Set([...(keep.ids_fusionados || []), drop.id, ...(drop.ids_fusionados || [])])];
  out.slugs_anteriores = [...new Set([...(keep.slugs_anteriores || []), ...(drop.slugs_anteriores || []), drop.slug].filter(Boolean))];
  return { out, keep, drop };
}

/* ------------------------------------------------------------------
   opening_hours de OSM -> formato normalizado de VetBA.
   Soporta: 24/7 · "Mo-Fr 09:00-13:00,16:00-20:00; Sa 09:00-13:00; Su off"
   · listas de días (Mo,We,Fr) · rangos que cruzan la semana (Sa-Mo).
   En OSM los días no mencionados están cerrados. Si aparece cualquier
   sintaxis que no se entiende (PH, meses, semanas, comentarios), devuelve
   null: preferimos "no informado" a un horario mal interpretado.
   ------------------------------------------------------------------ */
const OSM_DIAS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const VB_DIAS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
export function parsearOpeningHours(oh) {
  const s = String(oh || '').trim();
  if (!s) return null;
  if (/^24\/7$/.test(s)) return { '24h': true };
  const out = {};
  for (const regla of s.split(/\s*;\s*/).filter(Boolean)) {
    const m = /^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:\s*,\s*(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))?)*)\s+(off|closed|\d{2}:\d{2}-\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2}-\d{2}:\d{2})*)$/.exec(regla);
    if (!m) return null;
    const dias = [];
    for (const parte of m[1].split(/\s*,\s*/)) {
      const [a, b] = parte.split(/\s*-\s*/).map((x) => OSM_DIAS.indexOf(x));
      if (b === undefined) dias.push(a);
      else for (let i = a; ; i = (i + 1) % 7) { dias.push(i); if (i === b) break; }
    }
    const franjas = /^(off|closed)$/.test(m[2]) ? [] : m[2].split(/\s*,\s*/).map((f) => f.replace(/\s/g, ''));
    for (const i of dias) out[VB_DIAS[i]] = franjas;
  }
  for (const d of VB_DIAS) if (!(d in out)) out[d] = []; // semántica OSM: no mencionado = cerrado
  return out;
}

// Google (Apify) trae horario POR DÍA: [{day:'Monday', hours:'9 AM to 1 PM, 4 to 8 PM'}]
const G_DIAS = { monday: 'lun', tuesday: 'mar', wednesday: 'mie', thursday: 'jue', friday: 'vie', saturday: 'sab', sunday: 'dom', lunes: 'lun', martes: 'mar', 'miércoles': 'mie', miercoles: 'mie', jueves: 'jue', viernes: 'vie', 'sábado': 'sab', sabado: 'sab', domingo: 'dom' };
function rangoGoogle(seg) {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*(?:to|–|-|a)\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(seg.replace(/ | /g, ' ').trim());
  if (!m) return null;
  let ap1 = m[3];
  if (!ap1) { ap1 = m[6]; if (/pm/i.test(ap1) && +m[1] % 12 > +m[4] % 12) ap1 = 'AM'; }
  const h = (n, mm, ap) => String((+n % 12) + (/pm/i.test(ap) ? 12 : 0)).padStart(2, '0') + ':' + (mm || '00');
  return h(m[1], m[2], ap1) + '-' + h(m[4], m[5], m[6]);
}
export function parsearHorarioGoogle(lista) {
  if (!Array.isArray(lista) || !lista.length) return null;
  const out = {};
  for (const { day, hours } of lista) {
    const d = G_DIAS[norm(day)] || G_DIAS[String(day || '').toLowerCase()];
    if (!d) return null;
    const h = String(hours || '').trim();
    if (/open 24 hours|abierto las 24 horas/i.test(h)) { out[d] = ['00:00-24:00']; continue; }
    if (/^closed$|^cerrado$/i.test(h)) { out[d] = []; continue; }
    const fr = h.split(/\s*,\s*/).map(rangoGoogle);
    if (fr.some((x) => !x)) return null;
    out[d] = fr;
  }
  if (VB_DIAS.every((d) => (out[d] || []).length === 1 && out[d][0] === '00:00-24:00')) return { '24h': true };
  return out;
}

export const tieneHorarioPorDia = (r) => !!(r.horarios && (r.horarios['24h'] || VB_DIAS.some((d) => Array.isArray(r.horarios[d]))));
export const ZONAS_PARTIDO = {
  // Criterio del sitio: el norte del conurbano (y su corredor noroeste) va a GBA Norte, el oeste a GBA Oeste.
  'General San Martín': 'GBA Norte',
  'Tres de Febrero': 'GBA Oeste',
  'Vicente López': 'GBA Norte',
  'San Isidro': 'GBA Norte',
};

// Zonas nuevas: localidades por partido (null = el partido completo).
export const PARTIDOS = {
  'General San Martín': ['José León Suárez', 'Villa Ballester', 'San Andrés', 'Villa Maipú', 'Billinghurst', 'Villa Lynch', 'San Martín', 'Chilavert', 'Loma Hermosa', 'Villa Libertad', 'Villa Chacabuco', 'Villa Zagala'],
  'Tres de Febrero': ['Caseros', 'Ciudadela', 'Santos Lugares', 'Sáenz Peña', 'Martín Coronado', 'Ciudad Jardín Lomas del Palomar', 'El Palomar', 'Villa Bosch', 'Loma Hermosa', 'Pablo Podestá'],
  'Vicente López': null, // completo: se busca por partido
  'San Isidro': null,
};
