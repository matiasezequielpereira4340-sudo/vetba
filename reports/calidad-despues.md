# Calidad de datos — calidad-despues

Generado el 2026-11-03 desde `data.json` con `scripts/reporte-calidad.mjs`.

## Resumen

| Métrica | Registros | % |
|---|---:|---:|
| total | 445 | 100% |
| telefono | 309 | 69% |
| telefono valido | 302 | 68% |
| horario por dia | 55 | 12% |
| whatsapp | 1 | 0% |
| email | 3 | 1% |
| web | 27 | 6% |
| coordenadas | 445 | 100% |
| rating | 262 | 59% |
| barrio | 445 | 100% |
| partido | 245 | 55% |

"horario por día" = campo `horarios` normalizado (incluye los 24 h). El texto de Google sin días no cuenta.

## Por tipo

| Tipo | Registros |
|---|---:|
| veterinaria | 255 |
| petshop | 150 |
| peluqueria | 38 |
| laboratorio | 2 |

## Por zona

| Zona | Registros |
|---|---:|
| CABA | 200 |
| GBA Norte | 172 |
| GBA Sur | 37 |
| GBA Oeste | 36 |

## Por partido (GBA)

| Partido | Registros |
|---|---:|
| CABA (no aplica) | 200 |
| San Isidro | 65 |
| Vicente López | 52 |
| General San Martín | 48 |
| Tres de Febrero | 25 |
| La Plata | 16 |
| Avellaneda | 5 |
| La Matanza | 5 |
| Lanús | 5 |
| Lomas de Zamora | 5 |
| Morón | 5 |
| Quilmes | 5 |
| Tigre | 4 |
| San Fernando | 3 |
| Berazategui | 1 |
| San Miguel | 1 |

## Por barrio / localidad

| Barrio | Registros |
|---|---:|
| Palermo | 31 |
| Caballito | 22 |
| Martínez | 21 |
| Almagro | 19 |
| Flores | 19 |
| San Isidro | 19 |
| La Plata | 16 |
| Olivos | 16 |
| Recoleta | 15 |
| Florida | 13 |
| Balvanera | 12 |
| Béccar | 10 |
| San Andrés | 9 |
| San Martín | 9 |
| Barracas | 8 |
| Villa Crespo | 8 |
| Belgrano | 7 |
| Villa Adelina | 7 |
| Acassuso | 6 |
| Santos Lugares | 6 |
| Vicente López | 6 |
| Boedo | 5 |
| Boulogne Sur Mer | 5 |
| Chacarita | 5 |
| Lomas de Zamora | 5 |
| Morón | 5 |
| Parque Chacabuco | 5 |
| Ramos Mejía | 5 |
| Villa General José Tomás Guido | 5 |
| Villa General Juan Gregorio de Las Heras | 5 |
| Caseros | 4 |
| Constitución | 4 |
| José León Suárez | 4 |
| La Lucila | 4 |
| Monserrat | 4 |
| Munro | 4 |
| Parque Patricios | 4 |
| Quilmes | 4 |
| Sáenz Peña | 4 |
| Tigre | 4 |
| Villa Ballester | 4 |
| Villa General Mitre | 4 |
| Avellaneda | 3 |
| Florida Oeste | 3 |
| Lanús Este | 3 |
| Parque Avellaneda | 3 |
| San Cristóbal | 3 |
| Villa Lynch | 3 |
| Villa Martelli | 3 |
| Villa Urquiza | 3 |
| Ciudad Jardín Lomas del Palomar | 2 |
| Ciudadela | 2 |
| La Boca | 2 |
| La Paternal | 2 |
| Lanús Oeste | 2 |
| Loma Hermosa | 2 |
| Pablo Podestá | 2 |
| San Fernando | 2 |
| Vélez Sarsfield | 2 |
| Villa Bosch | 2 |
| Villa del Parque | 2 |
| Villa Maipú | 2 |
| Villa Santa Rita | 2 |
| Agronomía | 1 |
| Berazategui | 1 |
| Colegiales | 1 |
| Dock Sud | 1 |
| Floresta | 1 |
| Martín Coronado | 1 |
| Monte Castro | 1 |
| Nueva Pompeya | 1 |
| Piñeyro | 1 |
| Quilmes Oeste | 1 |
| Retiro | 1 |
| San Miguel | 1 |
| San Nicolás | 1 |
| Villa Ayacucho | 1 |
| Villa Chacabuco | 1 |
| Villa Ciudad Jardín El Libertador | 1 |
| Villa Juan Martín de Pueyrredón | 1 |
| Villa Libertad | 1 |
| Villa Marqués Alejandro María de Aguado | 1 |
| Villa Ortúzar | 1 |
| Villa Soldati | 1 |
| Villa Yapeyú | 1 |
| Virreyes | 1 |

## Registros sospechosos

### Barrio inválido o vacío (0)
- Ninguno

### Teléfono vacío o inválido (143)
- #173 Pet shop / peluquería canina — sin teléfono
- #182 Pupys Pet Shop y Peluquería Canina — sin teléfono
- #203 Pet Shop Firulais Farmacia veterinaria — sin teléfono
- #219 Veterinaria Pet Shop — sin teléfono
- #266 Clinica Verinaria Maggiolo — sin teléfono
- #267 Cota's 24hs Veterinaría — sin teléfono
- #268 Veterinaría — sin teléfono
- #269 Catdog Pet Shop — sin teléfono
- #270 Husky — sin teléfono
- #271 Veterinaria — sin teléfono
- #272 Mundo Mascota — sin teléfono
- #273 Peluquería Canina Estilon — sin teléfono
- #274 La Mascota de su Casa — sin teléfono
- #275 Madagascar — sin teléfono
- #276 La Huella — sin teléfono
- #277 My Sweet Friends — sin teléfono
- #278 T&T Consultorio Veterinario — sin teléfono
- #279 Black Dog Peluquería Canina — sin teléfono
- #280 Sarratea — sin teléfono
- #281 Viverito Sarratea — sin teléfono
- #282 Forrajería — sin teléfono
- #283 Hueso's — sin teléfono
- #285 MarketCan — sin teléfono
- #286 Clinica Veterinaria Tropezon — sin teléfono
- #287 Argos — sin teléfono
- #289 Amma — sin teléfono
- #290 Centro Mascota 2 — sin teléfono
- #291 Pata Pata — sin teléfono
- #292 Veterinaria Maiten — sin teléfono
- #293 Hospital Veterinario Pasteur — sin teléfono
- #294 FarmaPet City — sin teléfono
- #295 Centro veterinario San Martín — sin teléfono
- #297 Las Huellitas — sin teléfono
- #298 Roller — sin teléfono
- #299 Nutrican — sin teléfono
- #300 Nutrican — sin teléfono
- #301 Outlet Pet Shop — sin teléfono
- #302 Clínica Veterinaría San Martín — sin teléfono
- #303 El Rinón de la Mascotas — sin teléfono
- #304 Natural Life — sin teléfono
- #305 Alimentos para Mascotas — sin teléfono
- #306 Charly Veterinario — sin teléfono
- #307 Rock & Dog Peluquería Canina — sin teléfono
- #308 Aires — sin teléfono
- #309 Las Huellitas — sin teléfono
- #310 Forrajería — sin teléfono
- #314 Mascota Central — sin teléfono
- #316 Veterinaria — sin teléfono
- #321 Pet Shop Huellitas — sin teléfono
- #322 Como Perro y Gato — sin teléfono
- #324 Selpy Pet — sin teléfono
- #325 Veterinaria Eduardo — sin teléfono
- #327 Drovenort — sin teléfono
- #329 Mundo Animal — sin teléfono
- #331 Candy Pet Shop — sin teléfono
- #332 Perro Al Agua — sin teléfono
- #333 Mr. Dog — sin teléfono
- #334 Amici — sin teléfono
- #335 Centro Médico Veterinario Dr. Planas — sin teléfono
- #340 Hocicos — sin teléfono
- #341 Royal Canin — sin teléfono
- #342 Raffus — sin teléfono
- #343 Encalada Vet&Pet — sin teléfono
- #345 Beethoven — sin teléfono
- #346 El Jockey — sin teléfono
- #348 Lucky — sin teléfono
- #349 San Agustín — sin teléfono
- #351 El Cuervo — sin teléfono
- #353 CuruPet Martinez — sin teléfono
- #354 Puppis — sin teléfono
- #360 Centro Médico Veterinario La Horqueta — sin teléfono
- #362 Citypet — sin teléfono
- #363 Animal Town — sin teléfono
- #364 Puppis — sin teléfono
- #365 Cinovita — sin teléfono
- #366 Pelos y Patas — sin teléfono
- #367 Centro Médico Veterinario Martínez — sin teléfono
- #368 Puppis — sin teléfono
- #369 Centro Medico Veterinario — sin teléfono
- #370 Centro Medico Veterinaria — sin teléfono
- #371 Puppis — sin teléfono
- #373 CVI — sin teléfono
- #375 Lourdes — sin teléfono
- #377 Wapp — sin teléfono
- #378 Veterinaría Lavalle — sin teléfono
- #379 Cuatro Patas — sin teléfono
- #380 Hocikos — sin teléfono
- #381 La Chicha — sin teléfono
- #382 Gasmar — sin teléfono
- #383 ProPlan — sin teléfono
- #384 Arturo — sin teléfono
- #387 Super Pet's — sin teléfono
- #388 Roma — sin teléfono
- #389 Maskota's — sin teléfono
- #390 Veterinaria Ciudad Jardín — sin teléfono
- #391 Damaroma — sin teléfono
- #393 Don Boston — sin teléfono
- #394 Centro Veterinario — sin teléfono
- #395 Pet Shop Baloo — sin teléfono
- #396 Neyen — sin teléfono
- #397 Wapp — sin teléfono
- #398 Fernández Moreno — sin teléfono
- #399 Ciudadela — sin teléfono
- #400 Natural Life — sin teléfono
- #401 Animalis — sin teléfono
- #404 Perro al Agua — sin teléfono
- #406 El Arca — sin teléfono
- #407 Consultorio Veterinario — sin teléfono
- #411 Old Prince — sin teléfono
- #412 Peluquería Canina — sin teléfono
- #413 Veterinaria — sin teléfono
- #414 Star Can — sin teléfono
- #415 Puppis — sin teléfono
- #416 Veterinaria de la Quinta — sin teléfono
- #417 CuruPet Olivos — sin teléfono
- #418 Consultorio Veterinario — sin teléfono
- #419 Pulguitas — sin teléfono
- #420 Puppy Food — sin teléfono
- #423 Baufi — sin teléfono
- #428 Otto — sin teléfono
- #430 Distribuidora Carapachay — sin teléfono
- #431 Veterinaria Paraná — sin teléfono
- #432 Veterinaria del Este — sin teléfono
- #433 Mascocenter — sin teléfono
- #434 Veterinaria Mundo Animal — sin teléfono
- #435 Compostela — sin teléfono
- #436 Manchitas — sin teléfono
- #437 Malaika — sin teléfono
- #438 Bacanes — sin teléfono
- #439 Puppis — sin teléfono
- #441 Mapanis — sin teléfono
- #442 Nuevo Sol — sin teléfono
- #443 Madagascar — sin teléfono
- #444 Mascota Point — sin teléfono
- #445 Clínica Veterinaria VIDA — sin teléfono
- #447 Canguro — sin teléfono
- #187 Pet's Club. "El club de las Mascotas" — "+54 48282674": 8 dígitos nacionales (se esperan 10)
- #189 ZONA Pet Veterinaria — "+54 53706400": 8 dígitos nacionales (se esperan 10)
- #234 Dame La Pata - Pet shop y Peluqueria — "+54 48288668": 8 dígitos nacionales (se esperan 10)
- #235 Luly Vet Veterinaria y Pet Shop — "+54 21428363": 8 dígitos nacionales (se esperan 10)
- #263 Veterinaria TIPPY — "+54 75636873": 8 dígitos nacionales (se esperan 10)
- #357 Puppis — "+54 810 220 2345": característica inválida (81)
- #440 Puppis — "+54 810 220 2345": característica inválida (81)

### Tipo que no coincide con el nombre (5)
- #273 Peluquería Canina Estilon — petshop → peluqueria (nombre:peluqueria)
- #307 Rock & Dog Peluquería Canina — petshop → peluqueria (nombre:peluqueria)
- #343 Encalada Vet&Pet — petshop → veterinaria (nombre:veterinaria)
- #376 Peluquería canina lila — petshop → peluqueria (nombre:peluqueria)
- #412 Peluquería Canina — petshop → peluqueria (nombre:peluqueria)

### Posibles duplicados (2)
- #66 Laboratorio Rapela (Análisis Vet.) ↔ #67 Laboratorio Dr. Rapela (REVISAR: a 17 m, nombre parecido, distinta dirección (¿2 locales?))
- #74 Veterinaria M.A.P.A. Lanús Oeste ↔ #75 Hospital Veterinario M.A.P.A (REVISAR: mismo teléfono pero a 3.8 km (¿sucursales?))

### Horario "Horario comercial" (placeholder, no es un horario) (133)
### Sin horario (152)
### Sin calificación (183)
