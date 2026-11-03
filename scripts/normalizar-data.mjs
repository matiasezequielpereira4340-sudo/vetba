#!/usr/bin/env node
// VetBA — normalización reproducible de data.json (sin dependencias).
//
//   node scripts/normalizar-data.mjs          -> escribe data.json normalizado
//   node scripts/normalizar-data.mjs --check  -> solo informa, no escribe
//
// Reglas:
//  - NUNCA borra registros ni campos originales. Solo AGREGA campos derivados.
//  - La primera vez guarda una copia intacta en data.backup.json (no la pisa después).
//  - Es idempotente: correrlo dos veces da el mismo resultado.
//  - No inventa datos: si algo no se puede derivar con certeza, queda en null.
//
// Campos derivados que agrega (ver docs/DATA_SCHEMA.md):
//  - barrio:   localidad "limpia". null si la localidad original es un código postal
//              suelto ("DPS", "C1206AAB") o un genérico ("Cdad. Autónoma de Buenos Aires").
//  - horarios: formato normalizado. Solo se deriva {"24h": true} cuando horario === "24 horas".
//              Los textos tipo "10 AM to 8 PM" NO traen días, así que no se convierten
//              (se dejan en `horario` como referencia). Si ya existe `horarios` cargado a mano, se respeta.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data.json');
const BACKUP = path.join(ROOT, 'data.backup.json');
const CHECK = process.argv.includes('--check');

const raw = readFileSync(DATA, 'utf8');
const data = JSON.parse(raw);
if (!Array.isArray(data)) throw new Error('data.json debe ser un array');

if (!CHECK && !existsSync(BACKUP)) {
  writeFileSync(BACKUP, raw);
  console.log('Backup creado: data.backup.json');
}

const LOCALIDAD_INVALIDA = /^([A-Z]{3}|[A-Z]\d{4}[A-Z]{3}|Cdad\. Autónoma de Buenos Aires|Buenos Aires|CABA)$/;
// Localidades que se pueden leer sin ambigüedad desde la dirección (Google las incluye al final).
const LOCALIDADES_EN_DIRECCION = ['La Plata'];

function derivarBarrio(r) {
  const loc = String(r.localidad || '').trim();
  if (loc && !LOCALIDAD_INVALIDA.test(loc)) return loc;
  for (const l of LOCALIDADES_EN_DIRECCION) {
    if (new RegExp('\\b' + l + '\\b').test(r.direccion || '')) return l;
  }
  return null;
}

function derivarHorarios(r) {
  if (r.horarios && typeof r.horarios === 'object') return r.horarios; // cargado a mano: se respeta
  if (/^\s*24\s*(horas|hs|h)\s*$/i.test(r.horario || '')) return { '24h': true };
  return null;
}

const stats = { total: data.length, barrioNull: 0, horarios24: 0, cambios: 0 };
const out = data.map((r) => {
  const n = { ...r };
  n.barrio = derivarBarrio(r);
  const h = derivarHorarios(r);
  if (h) n.horarios = h; else delete n.horarios;
  if (n.barrio === null) stats.barrioNull++;
  if (h && h['24h']) stats.horarios24++;
  if (JSON.stringify(n) !== JSON.stringify(r)) stats.cambios++;
  return n;
});

if (out.length !== data.length) throw new Error('Se perdieron registros: abortado');

console.log(`Registros: ${stats.total} | modificados: ${stats.cambios} | sin barrio: ${stats.barrioNull} | horarios 24h: ${stats.horarios24}`);
if (stats.barrioNull) {
  console.log('Registros sin barrio (completar `barrio` a mano):');
  out.filter((r) => r.barrio === null).forEach((r) => console.log(`  #${r.id} ${r.nombre} — ${r.direccion} (localidad original: "${r.localidad}")`));
}

if (!CHECK) {
  // Un registro por línea: diffs legibles en git y archivo liviano.
  writeFileSync(DATA, '[\n' + out.map((r) => JSON.stringify(r)).join(',\n') + '\n]\n');
  console.log('data.json actualizado.');
}
