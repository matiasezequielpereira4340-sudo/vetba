# VetBA

Directorio de veterinarias, urgencias 24 h, peluquerías, pet shops y laboratorios de CABA y GBA — https://www.vetba.com.ar

## Cómo está armado

- `index.html` + `data.json`: el sitio principal. HTML/CSS/JS vanilla, todo inline, **sin build**. Si subís solo estos dos archivos, el sitio funciona.
- `recordatorios.html`, `terminos.html`, `privacidad.html`: páginas estáticas.
- `vendor/leaflet/`: copia local de Leaflet 1.9.4 para el mapa (si falta, se usa unpkg).
- `scripts/generar-paginas.mjs`: genera las páginas SEO (`/veterinarias/<barrio>`, `/urgencias-24-horas/<zona>`, `/ficha/<slug>`), `sitemap.xml` y `robots.txt`. Vercel lo corre en cada deploy (`npm run build:seo`). Las carpetas generadas no se versionan.
- `scripts/normalizar-data.mjs`: normaliza `data.json` (agrega `barrio` y `horarios`) sin borrar nada. La copia original está en `data.backup.json`.
- `admin-local.html`: herramientas de outreach. **No se publica** (`.vercelignore`).

## Comandos

```bash
npm run normalizar
```

```bash
npm run build:seo
```

```bash
python3 -m http.server 8080
```

## Documentación

- [Esquema de data.json y campos opcionales](docs/DATA_SCHEMA.md)
- [Tracking de contactos y reporte mensual](docs/TRACKING.md)

## Configuración

Al principio del `<script>` de `index.html` está el bloque `CONFIG` (WhatsApp, email, Instagram, Facebook). Si Instagram o Facebook quedan vacíos, el ícono no se muestra.
