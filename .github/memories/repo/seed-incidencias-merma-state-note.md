- En el seeder masivo, collectStateFromResponse no debe tratar objetos anidados de incidencia_linea como si fueran incidencias: contaminar incidenciaPendienteIds provoca 404 en POST /incidencias/:id/resolver.
- POST /merma necesita producto y cantidad acotados al stock real; seleccionar producto por inventario agregado y limitar la cantidad evita 400 por stock insuficiente en batches concurrentes.

- POST /merma/produccion/reportar no puede reutilizar el payload genérico de /merma: requiere produccionLoteId + productoId ingrediente de la receta del lote; en seed masivo conviene preresolver lote/ingrediente y cantidad segura desde stock para evitar 400 por contrato inválido.
