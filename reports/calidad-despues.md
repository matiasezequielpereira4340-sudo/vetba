# Calidad de datos — calidad-despues

Generado el 2026-11-03 desde `data.json` con `scripts/reporte-calidad.mjs`.

## Resumen

| Métrica | Registros | % |
|---|---:|---:|
| total | 725 | 100% |
| telefono | 582 | 80% |
| telefono valido | 565 | 78% |
| horario por dia | 327 | 45% |
| whatsapp | 1 | 0% |
| email | 33 | 5% |
| web | 142 | 20% |
| coordenadas | 725 | 100% |
| rating | 563 | 78% |
| barrio | 725 | 100% |
| partido | 517 | 71% |

"horario por día" = campo `horarios` normalizado (incluye los 24 h). El texto de Google sin días no cuenta.

## Por tipo

| Tipo | Registros |
|---|---:|
| veterinaria | 365 |
| petshop | 249 |
| peluqueria | 109 |
| laboratorio | 2 |

## Por zona

| Zona | Registros |
|---|---:|
| GBA Norte | 373 |
| CABA | 208 |
| GBA Oeste | 107 |
| GBA Sur | 37 |

## Por partido (GBA)

| Partido | Registros |
|---|---:|
| CABA (no aplica) | 208 |
| General San Martín | 142 |
| San Isidro | 121 |
| Tres de Febrero | 88 |
| Vicente López | 85 |
| San Fernando | 21 |
| La Plata | 16 |
| La Matanza | 13 |
| Avellaneda | 5 |
| Lanús | 5 |
| Lomas de Zamora | 5 |
| Morón | 5 |
| Quilmes | 5 |
| Tigre | 4 |
| Berazategui | 1 |
| San Miguel | 1 |

## Por barrio / localidad

| Barrio | Registros |
|---|---:|
| San Isidro | 32 |
| Palermo | 31 |
| Martínez | 29 |
| San Martín | 27 |
| Villa Adelina | 24 |
| Boulogne Sur Mer | 22 |
| Caballito | 22 |
| Villa Ballester | 21 |
| José León Suárez | 20 |
| Almagro | 19 |
| Flores | 19 |
| Munro | 19 |
| Olivos | 17 |
| La Plata | 16 |
| Caseros | 15 |
| Recoleta | 15 |
| Villa Bosch | 15 |
| San Fernando | 14 |
| Santos Lugares | 14 |
| Villa Martelli | 14 |
| Florida | 13 |
| Balvanera | 12 |
| Loma Hermosa | 11 |
| San Andrés | 11 |
| Villa Maipú | 11 |
| Béccar | 10 |
| Ciudad Jardín Lomas del Palomar | 10 |
| Pablo Podestá | 9 |
| Barracas | 8 |
| Villa Crespo | 8 |
| Acassuso | 7 |
| Belgrano | 7 |
| Billinghurst | 7 |
| Florida Oeste | 7 |
| Villa Ciudad Jardín El Libertador | 7 |
| Villa Lynch | 7 |
| Ciudadela | 6 |
| Vicente López | 6 |
| Boedo | 5 |
| Chacarita | 5 |
| La Lucila | 5 |
| La Tablada | 5 |
| Lomas de Zamora | 5 |
| Morón | 5 |
| Parque Chacabuco | 5 |
| Ramos Mejía | 5 |
| Sáenz Peña | 5 |
| Victoria | 5 |
| Villa General José Tomás Guido | 5 |
| Villa General Juan Gregorio de Las Heras | 5 |
| Constitución | 4 |
| Mataderos | 4 |
| Monserrat | 4 |
| Parque Patricios | 4 |
| Quilmes | 4 |
| Tigre | 4 |
| Villa General Mitre | 4 |
| Villa Granaderos de San Martín | 4 |
| Villa Libertad | 4 |
| Villa Luro | 4 |
| Avellaneda | 3 |
| Lanús Este | 3 |
| Parque Avellaneda | 3 |
| San Cristóbal | 3 |
| Villa Chacabuco | 3 |
| Villa Raffo | 3 |
| Villa Urquiza | 3 |
| La Boca | 2 |
| La Paternal | 2 |
| Lanús Oeste | 2 |
| San Justo | 2 |
| Vélez Sarsfield | 2 |
| Villa del Parque | 2 |
| Villa Godoy Cruz | 2 |
| Villa Santa Rita | 2 |
| Villa Yapeyú | 2 |
| Virreyes | 2 |
| Agronomía | 1 |
| Berazategui | 1 |
| Carapachay | 1 |
| Colegiales | 1 |
| Dock Sud | 1 |
| Floresta | 1 |
| Lomas del Mirador | 1 |
| Martín Coronado | 1 |
| Monte Castro | 1 |
| Nueva Pompeya | 1 |
| Piñeyro | 1 |
| Quilmes Oeste | 1 |
| Remedios de Escalada de San Martín | 1 |
| Retiro | 1 |
| San Miguel | 1 |
| San Nicolás | 1 |
| Villa Ayacucho | 1 |
| Villa Independencia | 1 |
| Villa Juan Martín de Pueyrredón | 1 |
| Villa Marqués Alejandro María de Aguado | 1 |
| Villa Ortúzar | 1 |
| Villa Soldati | 1 |

## Registros sospechosos

### Barrio inválido o vacío (0)
- Ninguno

### Teléfono vacío o inválido (160)
- #173 Pet shop / peluquería canina — sin teléfono
- #182 Pupys Pet Shop y Peluquería Canina — sin teléfono
- #203 Pet Shop Firulais Farmacia veterinaria — sin teléfono
- #219 Veterinaria Pet Shop — sin teléfono
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
- #293 Hospital Veterinario Pasteur — sin teléfono
- #294 FarmaPet City — sin teléfono
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
- #316 Veterinaria — sin teléfono
- #321 Pet Shop Huellitas — sin teléfono
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
- #362 Citypet — sin teléfono
- #363 Animal Town — sin teléfono
- #365 Cinovita — sin teléfono
- #366 Pelos y Patas — sin teléfono
- #368 Puppis — sin teléfono
- #370 Centro Medico Veterinaria — sin teléfono
- #371 Puppis — sin teléfono
- #373 CVI — sin teléfono
- #375 Lourdes — sin teléfono
- #377 Wapp — sin teléfono
- #379 Cuatro Patas — sin teléfono
- #380 Hocikos — sin teléfono
- #381 La Chicha — sin teléfono
- #383 ProPlan — sin teléfono
- #384 Arturo — sin teléfono
- #389 Maskota's — sin teléfono
- #393 Don Boston — sin teléfono
- #394 Centro Veterinario — sin teléfono
- #395 Pet Shop Baloo — sin teléfono
- #396 Neyen — sin teléfono
- #397 Wapp — sin teléfono
- #398 Fernández Moreno — sin teléfono
- #399 Ciudadela — sin teléfono
- #400 Natural Life — sin teléfono
- #404 Perro al Agua — sin teléfono
- #406 El Arca — sin teléfono
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
- #432 Veterinaria del Este — sin teléfono
- #433 Mascocenter — sin teléfono
- #434 Veterinaria Mundo Animal — sin teléfono
- #435 Compostela — sin teléfono
- #436 Manchitas — sin teléfono
- #437 Malaika — sin teléfono
- #438 Bacanes — sin teléfono
- #439 Puppis — sin teléfono
- #443 Madagascar — sin teléfono
- #444 Mascota Point — sin teléfono
- #445 Clínica Veterinaria VIDA — sin teléfono
- #447 Canguro — sin teléfono
- #449 Servicio Veterinario de Terapia Neural Dr. Ricardo Aita — sin teléfono
- #461 Veterinaria Claudia L. Guindi Doi UBA. Osteópata. ( CEOB) — sin teléfono
- #479 Veterinaria — sin teléfono
- #482 PET shop FG — sin teléfono
- #490 TINA PET SHOP — sin teléfono
- #492 EVET Consultorio de ecografía veterinaria — sin teléfono
- #513 Huella´s Pet shop — sin teléfono
- #523 Pet Shop La Casita de Luly — sin teléfono
- #538 ALFA PET SHOP TIENDA DE MASCOTAS — sin teléfono
- #554 Veterinarios Norte — sin teléfono
- #564 Maticaninos Peluqueria Canina — sin teléfono
- #573 Tienda De Mascotas "Tito" — sin teléfono
- #574 Centro Asistencial Veterinario — sin teléfono
- #577 Veterinaria RCF — sin teléfono
- #593 Pet Shop Onix — sin teléfono
- #594 Pet Shop El Bodegon — sin teléfono
- #602 Protenencia animal — sin teléfono
- #604 Pet Shop "La Jungla" — sin teléfono
- #605 Farmacia veterinaria. — sin teléfono
- #642 Emma — sin teléfono
- #650 PELUQUERÍA CANINA ATHENEA — sin teléfono
- #653 Pet Shop — sin teléfono
- #654 PET SHOP — sin teléfono
- #664 Veterinaria Rocca — sin teléfono
- #674 Pet Shop GT — sin teléfono
- #677 VETERINARIA — sin teléfono
- #694 Veterinaria Nikita — sin teléfono
- #707 veterinaria silvia ramat — sin teléfono
- #714 Tu Amigo Fiel — sin teléfono
- #738 City Pet — sin teléfono
- #745 Pet shop alay — sin teléfono
- #187 Pet's Club. "El club de las Mascotas" — "+54 48282674": 8 dígitos nacionales (se esperan 10)
- #189 ZONA Pet Veterinaria — "+54 53706400": 8 dígitos nacionales (se esperan 10)
- #234 Dame La Pata - Pet shop y Peluqueria — "+54 48288668": 8 dígitos nacionales (se esperan 10)
- #235 Luly Vet Veterinaria y Pet Shop — "+54 21428363": 8 dígitos nacionales (se esperan 10)
- #263 Veterinaria TIPPY — "+54 75636873": 8 dígitos nacionales (se esperan 10)
- #744 Puppis Veterinaria, Peluquería y Pet Shop — "+54 810-220-2345": característica inválida (81)
- #357 Puppis — "+54 810 220 2345": característica inválida (81)
- #367 Centro Médico Veterinario Martínez — "+54 47939350": 8 dígitos nacionales (se esperan 10)
- #440 Puppis — "+54 810 220 2345": característica inválida (81)
- #460 Clínica Veterinaria del Oeste — "+54 46472947": 8 dígitos nacionales (se esperan 10)
- #493 VETERINARIA POR MAS VIDA — "+54 47467739": 8 dígitos nacionales (se esperan 10)
- #522 Perrito Feliz — "+54 48426440": 8 dígitos nacionales (se esperan 10)
- #575 Veterinaria Concepcion — "+54 47382390": 8 dígitos nacionales (se esperan 10)
- #606 Como perros y gatos — "+54 35864484": 8 dígitos nacionales (se esperan 10)
- #621 Veterinaria Martín Rodríguez — "+54 47630329": 8 dígitos nacionales (se esperan 10)
- #661 Clínica Veterinaria Dra. Caminos. Dr. Pombar — "+54 21011633": 8 dígitos nacionales (se esperan 10)
- #746 Veterinaria guemes — "+54 52908825": 8 dígitos nacionales (se esperan 10)

### Tipo que no coincide con el nombre (6)
- #273 Peluquería Canina Estilon — petshop → peluqueria (nombre:peluqueria)
- #307 Rock & Dog Peluquería Canina — petshop → peluqueria (nombre:peluqueria)
- #343 Encalada Vet&Pet — petshop → veterinaria (nombre:veterinaria)
- #744 Puppis Veterinaria, Peluquería y Pet Shop — petshop → veterinaria (nombre:mixto->veterinaria)
- #376 Peluquería canina lila — petshop → peluqueria (nombre:peluqueria)
- #412 Peluquería Canina — petshop → peluqueria (nombre:peluqueria)

### Posibles duplicados (2)
- #66 Laboratorio Rapela (Análisis Vet.) ↔ #67 Laboratorio Dr. Rapela (REVISAR: a 17 m, nombre parecido, distinta dirección (¿2 locales?))
- #74 Veterinaria M.A.P.A. Lanús Oeste ↔ #75 Hospital Veterinario M.A.P.A (REVISAR: mismo teléfono pero a 3.8 km (¿sucursales?))

### Horario "Horario comercial" (placeholder, no es un horario) (133)
### Sin horario (161)
### Sin calificación (162)
