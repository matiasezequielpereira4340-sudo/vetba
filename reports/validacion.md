# Validación de data.json

Generado por `scripts/validar-data.mjs` el 2026-11-03.

| | |
|---|---:|
| Registros al empezar | 265 |
| Reclasificados (tipo) | 29 |
| Fusionados (salen) | 1 |
| Duplicados dudosos (revisar a mano) | 2 |
| Teléfonos inválidos | 5 |
| Barrios corregidos por coordenadas | 0 |
| Barrio/partido pendiente (falta correr con --red) | 105 |
| Horarios tomados de OSM | 0 |
| Registros al terminar | 264 |

## Reclasificados
Detalle en `reports/reclasificados.csv`. Cuando un registro deja de ser "veterinaria" se le quitan *consultas* y *vacunación*: el relevamiento original se los asignó a todas las veterinarias sin verificar.

## Fusiones
- Queda #136 Peluquería canina y Veterinaria San Cristóbal ← sale #141 Veterinaria - peluquería San Cristóbal (misma dirección y nombre parecido)

## Duplicados dudosos — NO se fusionaron, revisar a mano
- #66 Laboratorio Rapela (Análisis Vet.) (R. L. Falcón 2542) ↔ #67 Laboratorio Dr. Rapela (R. L. Falcón 2534): a 17 m, nombre parecido, distinta dirección (¿2 locales?)
- #74 Veterinaria M.A.P.A. Lanús Oeste (Av. San Martín 3301) ↔ #75 Hospital Veterinario M.A.P.A (Eva Perón 2251): mismo teléfono pero a 3.8 km (¿sucursales?)

## Teléfonos inválidos (no se muestra el botón Llamar)
- #187 Pet's Club. "El club de las Mascotas" — "+54 48282674": 8 dígitos nacionales (se esperan 10)
- #189 ZONA Pet Veterinaria — "+54 53706400": 8 dígitos nacionales (se esperan 10)
- #234 Dame La Pata - Pet shop y Peluqueria — "+54 48288668": 8 dígitos nacionales (se esperan 10)
- #235 Luly Vet Veterinaria y Pet Shop — "+54 21428363": 8 dígitos nacionales (se esperan 10)
- #263 Veterinaria TIPPY — "+54 75636873": 8 dígitos nacionales (se esperan 10)

## Barrios corregidos
- Ninguno (no se corrió con --red)

## Errores / avisos
- Ninguno
