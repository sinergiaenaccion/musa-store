# MUSA Digital — configuración de venta y descarga

## Arquitectura

La tienda pública puede seguir viviendo en GitHub Pages.

El checkout y la entrega digital viven en un deployment serverless (Vercel recomendado):

- `POST /api/create-preference` crea la preferencia de Mercado Pago.
- Mercado Pago devuelve al comprador a `digital-success.html`.
- `GET /api/verify-payment` consulta el pago directamente en Mercado Pago.
- Solo con estado `approved`, referencia coincidente y producto digital válido se genera un token temporal.
- `GET /api/download` valida el token y recién entonces recupera el PDF desde el almacenamiento privado.
- `POST /api/webhook` recibe las notificaciones de Mercado Pago para futuras mejoras de registro/automatización.

Mercado Pago documenta que Checkout Pro crea una preferencia y devuelve un `init_point`, y que las URLs de retorno pueden recibir `payment_id`, `status` y `external_reference`. La verificación definitiva se hace contra la API de pagos del servidor.

## Variables de entorno

Configurar en Vercel:

- `MP_ACCESS_TOKEN`: Access Token privado de Mercado Pago. Nunca ponerlo en `app.js`.
- `MUSA_API_BASE_URL`: URL pública del deployment serverless.
- `MUSA_SITE_URL`: URL pública de la tienda.
- `MUSA_DOWNLOAD_SECRET`: secreto largo y aleatorio para firmar enlaces temporales.
- `MUSA_PDF_URL_MUSA_D01` … `MUSA_PDF_URL_MUSA_D06`: ubicaciones privadas de los seis PDF.

## Almacenamiento de PDF

No publicar los PDF en GitHub Pages.

Usar almacenamiento privado (por ejemplo Vercel Blob privado, S3/R2 privado o equivalente) y colocar las URLs/identificadores necesarios como variables de entorno del backend.

La portada comercial sí puede seguir siendo pública porque está en `assets/digital/*.svg`.

## Publicación

1. Importar este repositorio en Vercel.
2. Configurar las variables de entorno.
3. Deploy.
4. Copiar la URL del deployment a `MUSA_API_BASE_URL`.
5. Subir los seis PDF al almacenamiento privado.
6. Configurar `MUSA_PDF_URL_MUSA_D01` … `D06`.
7. Configurar/validar las notificaciones de Mercado Pago hacia:
   `https://TU-PROYECTO.vercel.app/api/webhook`.
8. Probar un pago real de bajo importe antes de publicar el flujo.

## Importante

El frontend mantiene un fallback a WhatsApp si el checkout serverless todavía no está disponible. Así la tienda no queda rota durante la transición.
