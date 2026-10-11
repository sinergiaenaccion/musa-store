# MUSA — Revisión de experiencia de compra y dirección visual

**Estado:** requerimientos de diseño y producto registrados; pendientes de implementación, pruebas y revisión final.  
**Fuente:** observaciones de Fabi sobre la vista móvil del sitio de prueba.

## Dirección de marca

- Mantener el lema **«Brillá a tu manera»** y la identidad oficial de MUSA.
- Evitar el uso de «curaduría» como rótulo visible. Usar español natural en Argentina: «Selección MUSA», «Elegidos MUSA», «Favoritos MUSA» o «Inspiración MUSA», según la sección.
- Mantener el rosa como color identitario, combinado con dorado/champagne, tonos claros y acentos complementarios (por ejemplo lila, crema y negro suave). No convertir todo el sitio en una superficie rosa.
- Incorporar destellos, brillos, pequeños elementos 3D y movimiento sutil y cuidado. Priorizar rendimiento móvil, legibilidad, accesibilidad y opción de reducir movimiento.
- Priorizar fotografía natural y actual de jóvenes en situaciones cotidianas, con diversidad y una estética editorial auténtica. Usar solo imágenes con derechos o licencias adecuados.
- No redibujar, sustituir ni modificar el logo corporativo oficial aprobado.

## Inicio: estructura deseada

1. **Hero visual primero:** imagen protagonista de jóvenes, con tratamiento visual dinámico, brillos/detalles 3D y el mensaje «Brillá a tu manera». No colocar una grilla de productos como protagonista del primer pantallazo.
2. CTA principal hacia el catálogo: «Descubrí MUSA» o equivalente.
3. Acceso secundario a «MUSA Club» / «Empresas amigas».
4. Bloques breves de categorías o colecciones, evitando una página inicial excesivamente larga.
5. Presentación de la selección de productos más abajo, organizada por áreas y basada directamente en el catálogo maestro.
6. Beneficios y datos de compra únicamente si son reales y están configurados; no afirmar «stock real», «pago seguro» o descuentos sin validación operativa.

## Navegación y filtros

- Incluir las categorías al principio del menú desplegable para navegar sin recorrer toda la página.
- En la página de catálogo, colocar un botón de **filtros con ícono** en la parte superior, visible en móvil y escritorio.
- Al tocarlo, abrir un panel o desplegable con categoría, colección, rango de precio y disponibilidad.
- Mantener búsqueda y ordenamiento accesibles.
- Evitar que los filtros ocupen un bloque enorme permanente encima de la grilla.

## MUSA Club y Empresas amigas

- Mostrar un bloque/CTA compacto «Sumate a MUSA Club» o «Sumá tu empresa como amiga de MUSA».
- Al tocarlo, navegar a una página específica con la explicación y el formulario; no incrustar el formulario completo en la página de inicio.
- Separar claramente la adhesión de empresas amigas de las compras de productos MUSA.
- La política de privacidad y el consentimiento del formulario deben explicar el uso de datos; no presentar un formulario como operativo hasta confirmar que guarda y envía los datos correctamente.

## Catálogo y disponibilidad

- La fuente del catálogo debe ser el catálogo maestro aprobado y su estructura de datos (data/products.json en este repositorio), organizado por las áreas reales de MUSA, por ejemplo Beauty, Tech y Digital, más las categorías aprobadas que correspondan.
- Incorporar los productos del catálogo aunque aún no tengan precio final, cuando exista información suficiente para identificarlos.
- Si el producto no tiene precio aprobado o no está listo para la venta, mostrar **«Próximamente disponible»** y no permitir agregarlo al carrito.
- No inventar precios, stock, descuentos, disponibilidad ni características. No mostrar como disponible un producto sin confirmación.
- Revisar y corregir todas las imágenes faltantes o rotas. Cada ficha debe usar una imagen aprobada del producto; si aún no la hay, mostrar un marcador editorial prolijo sin simular una foto real.
- Mantener fichas breves y claras; los detalles completos pueden abrirse al entrar al producto.
- El carrito solo debe permitir productos efectivamente habilitados para compra y con precio/stock confirmados.

## Calidad y pruebas antes de considerar la actualización terminada

- [ ] Comparar el catálogo con el archivo maestro y registrar productos faltantes.
- [ ] Revisar rutas y enlaces desde menú, hero, categorías, catálogo y MUSA Club.
- [ ] Probar filtros en móvil y escritorio.
- [ ] Corregir imágenes rotas y textos cortados/superpuestos.
- [ ] Verificar que el acceso a MUSA Club abra una página independiente.
- [ ] Comprobar que los productos «Próximamente disponible» no puedan agregarse al carrito.
- [ ] Verificar que carrito, pago, stock y formularios se describan como funcionales solo si se probaron realmente.
- [ ] Revisar accesibilidad, contraste, movimiento reducido y velocidad móvil.

**Importante:** este documento fija la dirección de trabajo; no demuestra que los cambios estén implementados, que el formulario guarde información ni que la compra/pago esté operativa.
