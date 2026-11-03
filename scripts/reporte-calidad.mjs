#!/usr/bin/env node
// Reporte de calidad de data.json.
//   node scripts/reporte-calidad.mjs reports/calidad-antes.md [data.json]
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { leerJSON, barrioDe, normalizarTelefono, clasificar, sonDuplicados, tieneHorarioPorDia } from './lib/datos.mjs';

const salida = process.argv[2] || 'reports/calidad.md';
const fuente = process.argv[3] || 'data.json';
const data = leerJSON(fuente);

const cuenta = (f) => data.reduce((m, r) => { const k = f(r) ?? '(sin dato)'; m[k] = (m[k] || 0) + 1; return m; }, {});
const tabla = (obj, col) => '| ' + col + ' | Registros |\n|---|---:|\n' + Object.entries(obj).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'es')).map(([k, v]) => '| ' + k + ' | ' + v + ' |').join('\n');
const n = (f) => data.filter(f).length;
const pct = (x) => Math.round((x / data.length) * 100) + '%';

const tel = data.map((r) => [r, normalizarTelefono(r.telefono)]);
const telInvalidos = tel.filter(([r, t]) => r.telefono && !t.valido);
const reclas = data.map((r) => [r, clasificar(r)]).filter(([r, c]) => c.tipo !== r.tipo);
const dups = [];
for (let i = 0; i < data.length; i++) for (let j = i + 1; j < data.length; j++) { const m = sonDuplicados(data[i], data[j]); if (m) dups.push([data[i], data[j], (m.fusionar ? 'FUSIONAR: ' : 'REVISAR: ') + m.motivo]); }

const metricas = {
  total: data.length,
  telefono: n((r) => !!r.telefono),
  telefono_valido: tel.filter(([, t]) => t.valido).length,
  horario_por_dia: n(tieneHorarioPorDia),
  whatsapp: n((r) => !!r.whatsapp),
  email: n((r) => !!r.email),
  web: n((r) => !!(r.web || r.website)),
  coordenadas: n((r) => typeof r.lat === 'number'),
  rating: n((r) => +r.rating > 0),
  barrio: n((r) => !!barrioDe(r)),
  partido: n((r) => !!r.partido),
};

const md = `# Calidad de datos — ${path.basename(salida, '.md')}

Generado el ${new Date().toISOString().slice(0, 10)} desde \`${fuente}\` con \`scripts/reporte-calidad.mjs\`.

## Resumen

| Métrica | Registros | % |
|---|---:|---:|
${Object.entries(metricas).map(([k, v]) => '| ' + k.replace(/_/g, ' ') + ' | ' + v + ' | ' + pct(v) + ' |').join('\n')}

"horario por día" = campo \`horarios\` normalizado (incluye los 24 h). El texto de Google sin días no cuenta.

## Por tipo

${tabla(cuenta((r) => r.tipo), 'Tipo')}

## Por zona

${tabla(cuenta((r) => r.zona), 'Zona')}

## Por partido (GBA)

${tabla(cuenta((r) => (r.zona === 'CABA' ? null : r.partido) ?? (r.zona === 'CABA' ? 'CABA (no aplica)' : '(sin dato)')), 'Partido')}

## Por barrio / localidad

${tabla(cuenta((r) => barrioDe(r)), 'Barrio')}

## Registros sospechosos

### Barrio inválido o vacío (${n((r) => !barrioDe(r))})
${data.filter((r) => !barrioDe(r)).map((r) => '- #' + r.id + ' ' + r.nombre + ' — ' + r.direccion + ' (localidad original: "' + r.localidad + '")').join('\n') || '- Ninguno'}

### Teléfono vacío o inválido (${telInvalidos.length + n((r) => !r.telefono)})
${[...data.filter((r) => !r.telefono).map((r) => '- #' + r.id + ' ' + r.nombre + ' — sin teléfono'), ...telInvalidos.map(([r, t]) => '- #' + r.id + ' ' + r.nombre + ' — "' + r.telefono + '": ' + t.motivo)].join('\n') || '- Ninguno'}

### Tipo que no coincide con el nombre (${reclas.length})
${reclas.map(([r, c]) => '- #' + r.id + ' ' + r.nombre + ' — ' + r.tipo + ' → ' + c.tipo + ' (' + c.regla + ')').join('\n') || '- Ninguno'}

### Posibles duplicados (${dups.length})
${dups.map(([a, b, m]) => '- #' + a.id + ' ' + a.nombre + ' ↔ #' + b.id + ' ' + b.nombre + ' (' + m + ')').join('\n') || '- Ninguno'}

### Horario "Horario comercial" (placeholder, no es un horario) (${n((r) => /horario comercial/i.test(r.horario || ''))})
### Sin horario (${n((r) => !r.horario && !r.horarios)})
### Sin calificación (${n((r) => !(+r.rating > 0))})
`;
mkdirSync(path.dirname(salida), { recursive: true });
writeFileSync(salida, md);
console.log('Reporte escrito en ' + salida);
console.log(JSON.stringify(metricas));
