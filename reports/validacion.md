# Validación de data.json

Generado por `scripts/validar-data.mjs` el 2026-11-03.

| | |
|---|---:|
| Registros al empezar | 264 |
| Reclasificados (tipo) en esta corrida | 0 |
| Fusionados (salen) | 0 |
| Duplicados dudosos (revisar a mano) | 2 |
| Teléfonos inválidos | 5 |
| Barrios corregidos por coordenadas | 0 |
| Partido asignado por localidad (GBA) | 64 |
| Partido a revisar (localidad repartida) | 1 |
| Barrio/partido pendiente (falta correr con --red) | 105 |
| Horarios tomados de OSM | 0 |
| Registros al terminar | 264 |

## Reclasificados
Detalle en `reports/reclasificados.csv` (los 29 de la primera corrida; las siguientes no reclasificaron nada). Cuando un registro deja de ser "veterinaria" se le quitan *consultas* y *vacunación*: el relevamiento original se los asignó a todas las veterinarias sin verificar.

## Fusiones
- Ninguna

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

## Partido asignado por localidad
- #41 VETmood: Vicente López → Vicente López
- #42 CVO Centro Vet. Olivos: Olivos → Vicente López
- #43 Veterinaria Brisa: Olivos → Vicente López
- #44 Clínica Vet. & Pet Danbar: Vicente López → Vicente López
- #45 Veterinaria Isidro: San Isidro → San Isidro
- #46 Vet. Center Dr. Diego Diaz: San Isidro → San Isidro
- #47 Mascotamanía: San Isidro → San Isidro
- #48 Vet Krauss: San Isidro → San Isidro
- #68 Avellaneda Veterinary Center: Avellaneda → Avellaneda
- #69 Hospital Veterinario Municipal Avellaneda: Avellaneda → Avellaneda
- #70 Clínica Veterinaria Gutiérrez: Avellaneda → Avellaneda
- #71 Hospital Veterinario Avellaneda: Gerli → Avellaneda
- #72 My Vet's Avellaneda: Avellaneda → Avellaneda
- #73 Lanús Veterinary Hospital: Lanús → Lanús
- #74 Veterinaria M.A.P.A. Lanús Oeste: Lanús → Lanús
- #75 Hospital Veterinario M.A.P.A: Lanús → Lanús
- #76 Veterinaria Dr. Stella: Lanús → Lanús
- #77 Hospital Veterinario Santa Catalina: Lanús → Lanús
- #78 Quilmes Veterinary Hospital: Quilmes → Quilmes
- #79 Consultorio Vet. Dra. Ana Victoria Andrés: Quilmes → Quilmes
- #80 Colón Veterinary Hospital: Quilmes Oeste → Quilmes
- #81 Veterinaria Tweety Ecografías: Quilmes → Quilmes
- #82 Quilmes Veterinary Center: Quilmes → Quilmes
- #83 Clínica Veterinaria Lomas: Lomas de Zamora → Lomas de Zamora
- #84 Veterinaria Mainus: Lomas de Zamora → Lomas de Zamora
- #85 Danke Veterinary Clinic: Lomas de Zamora → Lomas de Zamora
- #86 SIMA-PET Bs As: Lomas de Zamora → Lomas de Zamora
- #87 Lomas del Sur Veterinaria: Lomas de Zamora → Lomas de Zamora
- #88 Centro Veterinario Morón: Morón → Morón
- #89 Veterinary Small Animal: Morón → Morón
- #90 Veterinary North Morón: Morón → Morón
- #91 Veterinaria Tierra Animal: Morón → Morón
- #92 Veterinaria Invet 24hs Morón: Morón → Morón
- #93 Pehuén Clínica Veterinaria: Ramos Mejía → La Matanza
- #94 Veterinaria Dra. Carrizo: Ramos Mejía → La Matanza
- #95 ProVeter Ramos Mejía: Ramos Mejía → La Matanza
- #96 FixVet 24: Ramos Mejía → La Matanza
- #97 Veterinaria Ramos Mejía: Ramos Mejía → La Matanza
- #98 Central Veterinaria Tigre: Tigre → Tigre
- #99 Centro Médico Veterinario Tigre: Tigre → Tigre
- #100 Centro Veterinario Trusoni: Tigre → Tigre
- #101 Veterinary Ribera: Tigre → Tigre
- #102 Veterinaria 3 de Febrero: San Fernando → San Fernando
- #103 Móvil Vet: San Fernando → San Fernando
- #104 Consultorio Veterinario Nehuén: Virreyes → San Fernando
- #105 Veterinary 24 Horas Berazategui: Berazategui → Berazategui
- #106 Veterinaria EVET 24hs: San Miguel → San Miguel
- #157 ROYAL PET - PELUQUERIA CANINA: San Isidro → San Isidro
- #158 Veterinaria Madagascar: La Plata → La Plata
- #159 ANIMALES Barberia Peluqueria: La Plata → La Plata
- #160 360 Mascota: La Plata → La Plata
- #161 Pet's Shop Animal's: La Plata → La Plata
- #162 Clínica Veterinaria Fénix: La Plata → La Plata
- #163 Clinica Veterinaria La Plata 10 y 58: La Plata → La Plata
- #164 Veterinaria Trudy's: La Plata → La Plata
- #165 Veterinaria Bastet: La Plata → La Plata
- #166 Veterinaria Mon: La Plata → La Plata
- #167 Veterinaria AD: La Plata → La Plata
- #168 Veterinaria La Grand-Rue: La Plata → La Plata
- #169 Veterinaria Malta: La Plata → La Plata
- #170 Veterinaria El Trébol: La Plata → La Plata
- #171 PeluVet- Peluqueria Canina- Veterinaria-PetShop: La Plata → La Plata
- #172 Fiel Tienda Animal y Peluqueria Canina: La Plata → La Plata
- #173 Pet shop / peluquería canina: La Plata → La Plata

## Partido a revisar
- #71 Hospital Veterinario Avellaneda: Avellaneda (Gerli se reparte entre Avellaneda y Lanús)

## Errores / avisos
- Ninguno
