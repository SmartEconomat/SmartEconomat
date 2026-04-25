# Checklist de Homogeneización UI/UX para Datatables y Grids

## 1. Accesibilidad y Navegación

- [ ] Todas las filas de datatables deben ser navegables con Tab y activables con Enter/Espacio.
- [ ] Todas las cards de vistas tipo grid deben ser navegables con Tab y activables con Enter/Espacio.
- [ ] Añadir roles y atributos ARIA adecuados (`role="button"`, `aria-label`, etc.) para lectores de pantalla.
- [ ] El modal de detalle debe ser accesible por teclado y cerrar con Esc.

## 2. Interacción homogénea

- [ ] El modal de detalle se abre al hacer clic en cualquier parte de la fila/card, no solo en iconos.
- [ ] Las columnas de las tablas deben ser ordenables por encabezado.
- [ ] En grid, toda la card debe ser clickable (no solo el título o imagen).

## 3. Visualización de imágenes

- [ ] El modal permite ampliar la imagen.
- [ ] Al cerrar la imagen ampliada con Esc, no debe quedar borde azul ni focus residual.

## 4. Consistencia visual

- [ ] Unificar cabeceras/tab bars en todas las vistas principales.
- [ ] Eliminar cualquier borde rojo o azul no intencionado en el navbar y menús.

---

> **Nota:** Usar este checklist como referencia obligatoria al crear o refactorizar cualquier datatable o grid en la app.
