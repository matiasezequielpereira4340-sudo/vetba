# Tracking de contactos (reporte mensual del plan Pro)

## Qué se mide

Todos los botones de contacto llaman a una única función, `trackEvent(nombre, datos)`, definida al inicio del JS de `index.html` (y replicada en `recordatorios.html` y en las páginas SEO generadas).

| Evento (`name`) | Cuándo | Propiedades |
|---|---|---|
| `Llamar` | clic en Llamar (`tel:`) | `ficha` = `"<id>:<slug>"`, `origen` |
| `WhatsApp` | clic en WhatsApp del establecimiento | idem |
| `Como llegar` | clic en Cómo llegar (Google Maps) | idem |
| `Reclamar ficha` | clic en "¿Sos el dueño? Reclamá esta ficha" | idem |
| `Urgencia abierta` | se abre el modo urgencia | `origen` |
| `Recordatorio creado`, `Google Calendar`, `Descargar ics` | uso de /recordatorios | — |

`origen` puede ser `listado`, `destacadas`, `ficha`, `urgencia`, `barrio`, `urgencias`, `ficha-seo`, `ficha-relacionada` o `recordatorios`.

Se mandan solo 2 propiedades por evento a propósito: es el máximo que acepta Vercel Web Analytics en el plan Pro.

## Cómo se envían

El sitio carga `/_vercel/insights/script.js` (Vercel Web Analytics) y `trackEvent()` usa la cola `window.va('event', {name, data})`, que es lo mismo que hace `track()` de `@vercel/analytics`, sin build ni dependencias.

Requisitos en Vercel:
1. Proyecto **vetbapet-deploy** → pestaña **Analytics** → habilitar Web Analytics (si no está).
2. Los **custom events requieren plan Pro o Enterprise** del equipo de Vercel. En plan Hobby las visitas se miden, pero los eventos se descartan.

Para probar en el navegador: abrí el sitio con `?debug=1` y mirá la consola (`[track] Llamar {...}`).

## Cómo sacar "contactos por ficha por mes"

En el dashboard de Vercel:
1. Analytics → **Events**.
2. Elegí el rango: el mes a reportar (por ejemplo, 1 al 31 de octubre).
3. Tocá el evento (`Llamar`, `WhatsApp` o `Como llegar`) y agrupá por la propiedad **`ficha`**.
4. Filtrá por el valor de la ficha (`<id>:<slug>`, por ejemplo `1:leocan-1`).
5. Anotá los totales de los 3 eventos: eso es el reporte mensual del cliente Pro.

Si en el futuro querés automatizarlo, la misma información está en la API de Vercel Analytics, o podés conectar `trackEvent()` a otro destino (Google Analytics 4, PostHog, una planilla) cambiando solo esa función.

Limitaciones honestas:
- Un clic en "Llamar" no garantiza que la llamada se haya hecho: mide intención de contacto.
- Los bloqueadores de anuncios pueden impedir parte de la medición.
