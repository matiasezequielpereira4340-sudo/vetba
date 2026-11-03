# Esquema de `data.json`

`data.json` es la **única fuente de datos** del sitio. Es un array de establecimientos, uno por línea.
Regla de oro: **si un campo no existe, el sitio oculta el elemento o filtro correspondiente** (nunca se muestra un valor inventado).

Después de editar a mano, corré:

```bash
node scripts/normalizar-data.mjs
```

```bash
npm run build:seo
```

## Campos existentes (vienen del relevamiento original)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | número | Único. No reutilizar. |
| `slug` | string | Único. Se usa en `/ficha/<slug>`. No cambiarlo una vez publicado (rompe links). |
| `tipo` | `veterinaria` \| `peluqueria` \| `petshop` \| `laboratorio` | |
| `nombre`, `direccion` | string | |
| `localidad` | string | Original de Google. **No usar directamente**: puede traer códigos postales. Usar `barrio`. |
| `zona` | `CABA` \| `GBA Norte` \| `GBA Sur` \| `GBA Oeste` | |
| `lat`, `lng` | número | |
| `telefono` | string | Formato libre (`011 4777-2377`, `+54 221 423-4518`). |
| `horario` | string | Texto original. `"Horario comercial"` es un placeholder del relevamiento y se trata como **no informado**. Textos como `"10 AM to 8 PM"` no indican días: se muestran solo como referencia. |
| `rating`, `reseñas` | número | Calificación y cantidad de reseñas **de Google** (no recolectadas por VetBA). |
| `placeId` | string | Google Place ID (se usa en "Cómo llegar"). |
| `servicios` | string[] | `consultas`, `vacunacion`, `24hs`, `urgencias`, `internacion`, `peluqueria`, `bano`, `alimentos`, `accesorios`, `petshop`, `laboratorio`, `analisis`… |

## Campos derivados (los escribe `scripts/normalizar-data.mjs`)

| Campo | Tipo | Notas |
|---|---|---|
| `barrio` | string \| null | Localidad limpia. `null` = hay que completarlo a mano (el script lista cuáles). Si lo cargás a mano, el script lo respeta mientras no sea un código postal. |
| `horarios` | objeto | Ver formato abajo. Hoy solo se deriva automáticamente `{"24h": true}`. |

## Formato normalizado de `horarios`

```json
"horarios": {
  "lun": ["09:00-13:00", "16:00-20:00"],
  "mar": ["09:00-20:00"],
  "mie": ["09:00-20:00"],
  "jue": ["09:00-20:00"],
  "vie": ["09:00-20:00"],
  "sab": ["10:00-14:00"],
  "dom": []
}
```

- Claves de día: `lun mar mie jue vie sab dom`.
- Cada día es una lista de franjas `"HH:MM-HH:MM"` (24 h, hora de Argentina).
- `[]` = **cerrado** ese día. **Día ausente = no informado** (nunca se asume cerrado).
- Franja que cruza la medianoche: `"20:00-02:00"` (cierra a las 2 del día siguiente).
- Abierto todo el día: `"00:00-24:00"`.
- Abierto siempre: `{"24h": true}` (no hace falta cargar los días).
- Si un registro no tiene `horarios`, el sitio muestra **"Horario no informado"** y no aparece en el filtro "Abierto ahora".

## Campos opcionales nuevos (completar a medida que los establecimientos los informen)

Todos son opcionales. Los filtros y bloques asociados **solo aparecen si al menos un registro tiene el dato**.

| Campo | Tipo | Ejemplo | Dónde se usa |
|---|---|---|---|
| `whatsapp` | string (solo dígitos, formato internacional) | `"5491123456789"` | Botón WhatsApp (listado, ficha, modo urgencia). Sin este campo **no** se muestra WhatsApp: un fijo no es WhatsApp. |
| `plan` | `"gratis"` \| `"pro"` \| `"premium"` | `"pro"` | Destacadas, badge Verificado, orden prioritario, urgencia destacada (premium). |
| `a_domicilio` | boolean | `true` | Filtro "A domicilio". |
| `exoticos` | boolean | `true` | Filtro "Animales exóticos". |
| `especialidades` | string[] | `["dermatologia","cardiologia","traumatologia"]` | Filtro "Especialidad" + chips en la ficha. |
| `medios_pago` | string[] | `["efectivo","debito","credito","mercadopago","transferencia"]` | Filtro "Medio de pago" + ficha. |
| `precios` | objeto | ver abajo | Ficha (solo si existe). |
| `galeria` | string[] (URLs de imágenes) | `["/img/fichas/leocan-1/1.jpg"]` | Ficha (plan Pro/Premium). |
| `sedes` | número | `3` | Informativo (plan Premium). |

### `precios`

```json
"precios": {
  "consulta": 25000,
  "antirrabica": 12000,
  "castracion_gato": 60000,
  "castracion_perro": 90000,
  "fecha_actualizacion": "2026-10-15"
}
```

- Valores en pesos, números enteros. Cualquier clave puede faltar.
- `fecha_actualizacion` es obligatoria si cargás precios (formato `AAAA-MM-DD`). Se muestra la leyenda: *"Precio informado por el establecimiento el DD/MM/AAAA. Consultá antes de ir."*

## Campos agregados por la validación y las fuentes nuevas (noviembre 2026)

| Campo | Lo escribe | Notas |
|---|---|---|
| `telefono_e164` | `validar-data.mjs` | `+541147771234` / `+5491123456789`. Si falta y la data está validada, el teléfono es inválido y **no** se muestra "Llamar". |
| `celular` | `validar-data.mjs`, `contactos-web.mjs` | Móvil explícito (+54 9 o 15). **No es WhatsApp**: nunca se muestra como botón verde. |
| `telefonos_alternativos` | fusión de duplicados | Teléfonos del registro fusionado, para no perderlos. |
| `whatsapp` | OSM `contact:whatsapp`, link `wa.me`/`api.whatsapp.com` en su web, o el dueño | WhatsApp **confirmado**. |
| `email`, `web`, `instagram`, `facebook` | OSM, Google (web), `contactos-web.mjs` | Instagram/Facebook solo si figuran en su propia web u OSM. |
| `partido` | Nominatim (`validar-data.mjs --red`) o la descarga por partido | Solo GBA. Genera `/veterinarias/partido/<partido>`. |
| `fuente` | todos | `["google"]`, `["osm"]` o ambos. Si hay alguno `osm`, el sitio muestra el crédito ODbL. |
| `osm_id` | OSM | `node/123`, `way/456`. |
| `slug_definitivo` | `slugs.mjs` | `true` = la URL `/ficha/<slug>` ya no cambia. |
| `slugs_anteriores` | `slugs.mjs`, fusiones | URLs viejas: redirect 301 en `vercel.json` y `?ficha=`/`?reclamar=` siguen funcionando. |
| `ids_fusionados` | `validar-data.mjs` | Ids de registros que se fusionaron en este. |
| `contacto_web_revisado` | `contactos-web.mjs` | Fecha en que se tomaron datos de su web. |

Zonas de los partidos nuevos: General San Martín, Vicente López y San Isidro → `GBA Norte`; Tres de Febrero → `GBA Oeste` (definido en `scripts/lib/datos.mjs#ZONAS_PARTIDO`).

### Flujo de datos

```bash
npm run datos
```
Valida, asigna slugs y regenera `contactos/outreach.csv` (sin internet).

```bash
npm run fuentes:descargar
```
```bash
npm run fuentes:unir
```
Necesitan acceso a cdn.buenosaires.gob.ar, overpass-api.de, nominatim.openstreetmap.org, las webs de cada lugar y (opcional) api.apify.com.
