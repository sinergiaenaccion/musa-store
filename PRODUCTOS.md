# Cargar productos en MUSA ♡

Por ahora el catálogo público de MUSA está enfocado en **productos digitales**.

Los productos activos viven en `data/products.json`. Los productos físicos quedan fuera de la tienda hasta que estén realmente disponibles.

## Para agregar un workbook digital

Copiá uno de los objetos existentes y completá:

- `id`: código único, por ejemplo `MUSA-D09`.
- `name`: nombre visible.
- `price`: precio de venta en pesos.
- `category`: actualmente `digital`.
- `badge`: etiqueta de la tarjeta.
- `sub`: descripción corta.
- `description`: explicación comercial del workbook.
- `includes`: lista breve de lo que incluye.
- `pages`: cantidad de páginas.
- `image`: portada pública.
- `digital`: `true`.
- `active`: usar `false` para ocultarlo sin borrarlo.

La entrega del PDF no se configura en este archivo. El backend usa las variables privadas `MUSA_PDF_URL_MUSA_D01` … `D08`.

## Productos físicos

Cuando MUSA incorpore nuevamente productos físicos, se pueden reactivar en el catálogo y volver a conectar stock, peso, medidas y logística.

Los campos de peso y dimensiones pueden volver a utilizarse para futuras cotizaciones con Correo Argentino, Andreani o PUDO.