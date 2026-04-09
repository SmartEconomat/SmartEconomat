# Inventario

## Documentos

| # | Fichero | Contenido |
|---|---------|-----------|
| 1 | [ajustes-manuales-auditoria.md](./ajustes-manuales-auditoria.md) | Caso de uso de regularizaciones manuales con auditoría, contrato API, reglas de negocio, flujo transaccional y cobertura de tests. |

## Casos de uso cubiertos

- Ajustes manuales de inventario con auditoría.
- Validación estricta de payloads de regularización.
- Registro transaccional de `Inventario` y `Movimiento`.
- Trazabilidad del usuario que ejecuta la acción.

## Componentes backend implicados

- `InventarioController`
- `InventarioService`
- `Inventario`
- `Movimiento`
- `TipoMovimientoManual`

## Permiso requerido

- `inventario:ajustar_stock`
