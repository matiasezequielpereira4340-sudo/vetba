# Calidad de datos — calidad-despues

Generado el 2026-11-03 desde `data.json` con `scripts/reporte-calidad.mjs`.

## Resumen

| Métrica | Registros | % |
|---|---:|---:|
| total | 264 | 100% |
| telefono | 260 | 98% |
| telefono valido | 255 | 97% |
| horario por dia | 22 | 8% |
| whatsapp | 0 | 0% |
| email | 0 | 0% |
| web | 0 | 0% |
| coordenadas | 264 | 100% |
| rating | 262 | 99% |
| barrio | 223 | 84% |
| partido | 64 | 24% |

"horario por día" = campo `horarios` normalizado (incluye los 24 h). El texto de Google sin días no cuenta.

## Por tipo

| Tipo | Registros |
|---|---:|
| veterinaria | 173 |
| petshop | 53 |
| peluqueria | 36 |
| laboratorio | 2 |

## Por zona

| Zona | Registros |
|---|---:|
| CABA | 200 |
| GBA Sur | 37 |
| GBA Norte | 16 |
| GBA Oeste | 11 |

## Por partido (GBA)

| Partido | Registros |
|---|---:|
| CABA (no aplica) | 200 |
| La Plata | 16 |
| Avellaneda | 5 |
| La Matanza | 5 |
| Lanús | 5 |
| Lomas de Zamora | 5 |
| Morón | 5 |
| Quilmes | 5 |
| San Isidro | 5 |
| Tigre | 4 |
| Vicente López | 4 |
| San Fernando | 3 |
| Berazategui | 1 |
| San Miguel | 1 |

## Por barrio / localidad

| Barrio | Registros |
|---|---:|
| (sin dato) | 41 |
| Palermo | 25 |
| Caballito | 20 |
| Flores | 18 |
| La Plata | 16 |
| Almagro | 14 |
| Balvanera | 9 |
| Barrio Norte | 9 |
| Boedo | 9 |
| Recoleta | 8 |
| Barracas | 7 |
| Villa Crespo | 7 |
| Belgrano | 6 |
| Lanús | 5 |
| Lomas de Zamora | 5 |
| Morón | 5 |
| Ramos Mejía | 5 |
| San Isidro | 5 |
| Avellaneda | 4 |
| Constitución | 4 |
| Floresta | 4 |
| Monserrat | 4 |
| Quilmes | 4 |
| San Cristóbal | 4 |
| Tigre | 4 |
| Villa Urquiza | 3 |
| Agronomía | 2 |
| Colegiales | 2 |
| La Boca | 2 |
| Olivos | 2 |
| San Fernando | 2 |
| Vicente López | 2 |
| Berazategui | 1 |
| Gerli | 1 |
| Quilmes Oeste | 1 |
| Retiro | 1 |
| San Miguel | 1 |
| San Nicolás | 1 |
| Virreyes | 1 |

## Registros sospechosos

### Barrio inválido o vacío (41)
- #176 Piscu Pet Shop — Don Bosco 3882 C1206AAB (localidad original: "C1206AAB")
- #184 Centro Veterinario Dorrego Pet Shop Peluqueria Canina — Av. Corrientes 6335 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #185 Profesional Farmacia Veterinaria — Av. Warnes 2700 (localidad original: "DPS")
- #186 Al Toque Perro Pet shop — Roseti 1849 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #187 Pet's Club. "El club de las Mascotas" — C1417AAG, Cuenca 2550 (localidad original: "AAH")
- #188 +Cotas Pet shop — Terrada 2055 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #189 ZONA Pet Veterinaria — Av. Córdoba 6400 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #190 CLUB MASCOTAS PETSHOP BAÑO Y PELUQUERÍA CANINA — Gavilán 1725 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #191 TotalPet Chacarita — Av. Federico Lacroze 3776 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #192 Veterinaria Rumah — Álvarez Jonte 2600 (localidad original: "EXX")
- #195 El Parque Pet Shop y veterinaria — La Rioja 1956 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #196 8 Patitas Pet Shop — Av. Caseros 2744 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #199 Asamblea Pet Shop — Av. Asamblea 76 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #201 Veteba — Av. Suárez 3360 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #202 Veterinaria Cobo Vet — Av. Cobo 540 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #203 Pet Shop Firulais Farmacia veterinaria — Gral. Fructuoso Rivera 2961 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #207 Peluquería Canina PELU DOGS — Av. Eva Perón 3781 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #208 Peluquería Canina Marie Pets — Av. Lacarra 640 (localidad original: "C1406GZD")
- #212 Veterinaria El Parque Lacarra — Av. Lacarra 634 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #214 Pet Shop Vallese — Felipe Vallese 2376 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #215 Peluquería Canina "Toys" — Yerbal 2328 (localidad original: "GKB")
- #216 VETERINARIA SHREK — Av. Tte. Gral. Donato Álvarez 575 (localidad original: "BOD")
- #220 LETVET — Av. José María Moreno 811 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #224 Lo de Fidel (Veterinaria) — Av. Tte. Gral. Donato Álvarez 862 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #225 VETERINARIA FARMAVET — Av. Gaona 2999 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #230 Veterinaria Pacalú — Gurruchaga 632 (localidad original: "C1414DHN")
- #231 Peluquería Canina Patas & Pelos Pet Shop — Yerbal 721 Loc 4 (localidad original: "C1405CDO")
- #237 Pet shop Peluquería Canina "Don Fleco" — Olleros 4145 (localidad original: "EEM")
- #241 Las Razas Vet — Paraguay 3514 (localidad original: "BRV")
- #246 Pet Shop El bulldog - Huellitas — Av. Directorio 1508 (localidad original: "Buenos Aires")
- #250 Bubbels Pet Shop y Peluquería Canina — Gavilán 1087 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #251 Bruna Belleza Canina — Gral. José Gervasio Artigas 892 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #253 PET SHOP — Gavilán 2315 (localidad original: "EFU")
- #254 La Nueva Esquina — Av. Tte. Gral. Donato Álvarez 1300 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #255 Happy Pet Accesorios - Venta Mayorista de Productos para mascotas — Pedro Del Castillo 1336 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #256 Puppis Veterinaria, Peluqueria y Pet Shop — Av. Álvarez Thomas 311 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #258 Puppy Shop — Moreno 1819 (localidad original: "ABA")
- #261 Pet Shop y Clínica Veterinaria Mascotas de la Abadía — Av. Jorge Newbery 1761 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #263 Veterinaria TIPPY — Migueletes 1214 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #264 DOG WASH — Jerónimo Salguero 2537 (localidad original: "Cdad. Autónoma de Buenos Aires")
- #265 Puppis Veterinaria, Peluquería y Pet Shop — Bulnes 2052 (localidad original: "DKJ")

### Teléfono vacío o inválido (9)
- #173 Pet shop / peluquería canina — sin teléfono
- #182 Pupys Pet Shop y Peluquería Canina — sin teléfono
- #203 Pet Shop Firulais Farmacia veterinaria — sin teléfono
- #219 Veterinaria Pet Shop — sin teléfono
- #187 Pet's Club. "El club de las Mascotas" — "+54 48282674": 8 dígitos nacionales (se esperan 10)
- #189 ZONA Pet Veterinaria — "+54 53706400": 8 dígitos nacionales (se esperan 10)
- #234 Dame La Pata - Pet shop y Peluqueria — "+54 48288668": 8 dígitos nacionales (se esperan 10)
- #235 Luly Vet Veterinaria y Pet Shop — "+54 21428363": 8 dígitos nacionales (se esperan 10)
- #263 Veterinaria TIPPY — "+54 75636873": 8 dígitos nacionales (se esperan 10)

### Tipo que no coincide con el nombre (0)
- Ninguno

### Posibles duplicados (2)
- #66 Laboratorio Rapela (Análisis Vet.) ↔ #67 Laboratorio Dr. Rapela (REVISAR: a 17 m, nombre parecido, distinta dirección (¿2 locales?))
- #74 Veterinaria M.A.P.A. Lanús Oeste ↔ #75 Hospital Veterinario M.A.P.A (REVISAR: mismo teléfono pero a 3.8 km (¿sucursales?))

### Horario "Horario comercial" (placeholder, no es un horario) (133)
### Sin horario (6)
### Sin calificación (2)

---

## Antes y después (backup del 03/11/2026 vs. data.json actual)

| Métrica | Antes | Después | Δ |
|---|---:|---:|---:|
| Total de registros | 265 | 264 | -1 |
| Registros GBA | 64 | 64 | +0 |
| Con partido (GBA) | 0 | 64 | +64 |
| Horario por día | 22 | 22 | +0 |
| Email | 0 | 0 | +0 |
| WhatsApp confirmado | 0 | 0 | +0 |
| Web | 0 | 0 | +0 |
| Teléfono válido (E.164) | 256 | 255 | -1 |
| Fuente OSM | 0 | 0 | +0 |

### Registros por partido (GBA)

| Partido | Antes | Después |
|---|---:|---:|
| La Plata | 0 | 16 |
| San Isidro | 0 | 5 |
| Avellaneda | 0 | 5 |
| Lanús | 0 | 5 |
| Quilmes | 0 | 5 |
| Lomas de Zamora | 0 | 5 |
| Morón | 0 | 5 |
| La Matanza | 0 | 5 |
| Vicente López | 0 | 4 |
| Tigre | 0 | 4 |
| San Fernando | 0 | 3 |
| Berazategui | 0 | 1 |
| San Miguel | 0 | 1 |
| (sin dato) | 64 | 0 |
| General San Martín | 0 | 0 |
| Tres de Febrero | 0 | 0 |


**Qué sigue sin moverse y por qué:** horario por día, email, WhatsApp, web y las zonas nuevas (General San Martín, Tres de Febrero y más registros de Vicente López / San Isidro) dependen de overpass-api.de, nominatim.openstreetmap.org, cdn.buenosaires.gob.ar y las webs de cada lugar. En la corrida del 03/11/2026 (2.ª sesión) el proxy del entorno siguió respondiendo 403 a todos esos dominios. El partido de los 64 registros de GBA se asignó sin internet a partir de la localidad (`partido_fuente: "localidad"`); #71 (Gerli) queda marcado para revisar.
