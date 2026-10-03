# MUSA Digital — configuración de venta y descarga

## MVP de lanzamiento

La tienda pública queda enfocada exclusivamente en los **8 workbooks digitales finales** de MUSA.

No se muestran productos físicos por el momento y no se aplica ninguna regla de envío. Los productos digitales se agregan al carrito y se compran online.

### Colección actual

- MUSA-D01 — Workbook Glow Up
- MUSA-D02 — Workbook Study Girl
- MUSA-D03 — Workbook Sunday Reset
- MUSA-D04 — Workbook Bestie
- MUSA-D05 — Workbook Money Girl
- MUSA-D06 — My Life Planner
- MUSA-D07 — Workbook Agradecimiento
- MUSA-D08 — Workbook Relax

## Arquitectura

La tienda pública puede seguir viviendo en GitHub Pages.

El checkout y la entrega digital viven en un deployment serverless (Vercel recomendado):

- `POST /api/create-preference` recibe los productos del carrito y crea una preferencia de Mercado Pago.
- Mercado Pago devuelve al comprador a `digital-success.html`.
- `GET /api/verify-payment` consulta el pago directamente en Mercado Pago.
- Solo con estado `approved`, referencia coincidente y productos digitales válidos se generan enlaces temporales.
- `GET /api/download` valida el token y recién entonces recupera el PDF desde el almacenamiento privado.
- `POST /api/webhook` recibe las notificaciones de Mercado Pago.

## Variables de entorno

Configurar en Vercel:

- `MP_ACCESS_TOKEN`: Access Token privado de Mercado Pago.
- `MP_WEBHOOK_SECRET`: secreto para validar las notificaciones.
- `MUSA_API_BASE_URL`: URL pública del deployment serverless.
- `MUSA_SITE_URL`: URL pública de la tienda.
- `MUSA_DOWNLOAD_SECRET`: secreto largo y aleatorio para firmar enlaces temporales.
- `MUSA_PDF_URL_MUSA_D01` … `MUSA_PDF_URL_MUSA_D08`: ubicaciones privadas de los ocho PDF.

## Almacenamiento de PDF

No publicar los PDF de venta en GitHub Pages.

Usar almacenamiento privado (por ejemplo Vercel Blob privado, S3/R2 privado o equivalente) y colocar las URLs/identificadores necesarios como variables de entorno del backend.

Las portadas comerciales sí pueden seguir siendo públicas en `assets/digital/`.

## Publicación

1. Importar este repositorio en Vercel.
2. Configurar las variables de entorno.
3. Deploy.
4. Copiar la URL del deployment a `MUSA_API_BASE_URL`.
5. Subir los ocho PDF al almacenamiento privado.
6. Configurar `MUSA_PDF_URL_MUSA_D01` … `D08`.
7. Configurar las notificaciones de Mercado Pago hacia:
   `https://TU-PROYECTO.vercel.app/api/webhook`.
8. Probar un pago real de bajo importe antes de comunicar oficialmente la venta.

## Fallback

Si Mercado Pago todavía no está configurado, el botón de checkout deriva la consulta a WhatsApp para que la tienda no quede bloqueada durante la transición.

## Evolución

Cuando MUSA incorpore productos físicos, se pueden volver a activar el catálogo, el cálculo de envíos y las integraciones con Correo Argentino, Andreani o PUDO sin rehacer la estructura principal.