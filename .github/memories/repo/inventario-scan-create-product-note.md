# Inventario scan -> alta producto

- En alta de producto desde Inventario, validar `proveedores[].precioUnitario` como número finito >= 0 antes de enviar payload.
- `ProveedorSelector` puede producir `NaN` al vaciar precio; ese `NaN` provoca 400 en backend por `IsNumber` en `AddProveedorToProductoDto`.
- Regla funcional aplicada en UI: al escanear producto fuera de inventario, si existe en catálogo se solicita cantidad a añadir; si no existe, se crea producto y luego también se solicita cantidad.
- En listado agregado de inventario, ocultar productos con `cantidadTotal <= 0` para reflejar solo stock disponible.
