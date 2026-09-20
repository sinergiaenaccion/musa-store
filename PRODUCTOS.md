# Cargar productos en MUSA ♡

Por ahora el catálogo de MUSA vive en `data/products.json`.

## Para agregar un producto

Copiá uno de los objetos existentes y completá:

- `id`: código único, por ejemplo `MUSA-009`.
- `name`: nombre visible.
- `price`: precio de venta en pesos.
- `cost`: costo de compra (interno; no se muestra en la tienda).
- `stock`: unidades disponibles.
- `category`: `beauty`, `tech`, `accessories`, `school` o `gifts`.
- `badge`: etiqueta que aparece en la tarjeta.
- `sub`: pequeña descripción.
- `emoji` y `bg`: imagen provisional hasta incorporar fotos reales.
- `featured`: aparece en destacados.
- `musaPick`: aparece como MUSA PICK / MUSA INSPIRACIÓN.
- `newDrop`: aparece en novedades.
- `weightGrams`: peso aproximado del producto.
- `dimensionsCm`: largo, ancho y alto en cm.
- `active`: usar `false` para ocultarlo sin borrarlo.

## Importante

El `cost` es interno y no se publica. El peso y las medidas quedan preparados para futuras cotizaciones con Correo Argentino, Andreani o PUDO.

La carga manual es la primera etapa. Más adelante construiremos **MUSA ADMIN**, para hacer lo mismo desde el celular sin editar código.
