# MUSA — Brillá tu manera. ♡

MUSA is a custom-built ecommerce storefront for Córdoba, Argentina.

## Dirección

- Frontend propio, sin plantilla de Tiendanube.
- Mobile-first y responsive.
- Identidad teen/lifestyle: beauty, tech, accesorios, papelería, **cole** y regalos.
- Curaduría: **MUSA PICKS** y **MUSA INSPIRACIÓN**.
- WhatsApp: +54 9 351 339-4174.
- Envíos a todo el país en preparación con operadores como Correo Argentino, Andreani y PUDO.
- Envío bonificado configurado conceptualmente para compras desde **$50.000**.
- Mercado Pago preparado para integración segura en backend.

## Catálogo

Los productos viven en `data/products.json`.

Cada producto tiene precio, costo interno, stock, categoría, etiquetas, peso y medidas. El costo no se publica. El peso y las medidas quedan preparados para futuras cotizaciones de envío.

Guía: `PRODUCTOS.md`.

## Importante

La web pública puede vivir en GitHub Pages, pero las credenciales privadas de Mercado Pago y las APIs de operadores logísticos no deben colocarse en JavaScript público. La siguiente etapa será crear el backend/serverless seguro para:

1. crear la orden de Mercado Pago;
2. recibir la confirmación del pago;
3. cotizar/crear el envío;
4. registrar el pedido;
5. actualizar stock.

## Redes

- Instagram: @hellomusa.store
- Facebook: @hellomusa.store
- TikTok: @musai678
- Email: hellomusa.store@gmail.com

© 2026 MUSA — Todos los derechos reservados.
