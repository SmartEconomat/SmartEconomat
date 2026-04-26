# Reglas de Negocio

## Problema que resuelve

SmartEconomat digitaliza la operativa de economato en centros educativos: control de stock, compras, recepciones, incidencias, produccion y trazabilidad por usuario/rol.

## Roles operativos

Roles funcionales observables en el sistema:

- Administracion: gestion global de usuarios, permisos y operativa.
- Profesorado: gestion de pedidos, recepciones y flujos docentes asociados.
- Alumnado: acceso restringido segun permisos y slots educativos.

> La autorizacion real depende de permisos efectivos (RBAC), no solo del nombre del rol.

## Flujos principales

### 1) Compras y abastecimiento

1. Se generan necesidades de compra (`pedido_usuario` y lineas).
2. Se consolidan en pedidos internos/proveedor.
3. Se recibe mercancia y se validan cantidades/estados.
4. Se registran incidencias cuando hay diferencias.
5. Se actualiza inventario y trazabilidad.

### 2) Inventario y movimientos

- Inventario asociado a producto-proveedor y ubicacion.
- Movimientos registran entradas/salidas/ajustes/mermas.
- Se mantiene historial para auditoria y control operativo.

### 3) Produccion/cocina

- Recetas con ingredientes y cantidades.
- Preparaciones planificadas/ejecutadas.
- Lotes de produccion con porciones, costes y estado.

## Restricciones relevantes

- Contratos backend (DTO/enums/validaciones) son fuente de verdad.
- IDs de dominio: UUID v7 en base de datos (salvo excepciones definidas por modelo).
- Validacion de entrada estricta (whitelist y rechazo de campos no permitidos).
- Soft delete para preservar historial donde aplica.

## Automatizaciones

- Seeders para bootstrap y datos de apoyo.
- Ejecutores de migracion y despliegue via scripts.
- En instalador: validaciones preflight, readiness y orquestacion de servicios.

## Dependencias entre modulos

- Compras alimenta recepcion.
- Recepcion impacta inventario e incidencias.
- Inventario alimenta produccion y costes.
- Seguridad RBAC aplica transversalmente a todos los modulos.

## Casos especiales

- Operacion sin datos semilla completos: soportada, pero con funcionalidad limitada segun entidades base existentes.
- Produccion con TLS configurable (`selfsigned` / otros proveedores declarados por entorno).

## Lo que no se documenta como hecho

- No se documentan features no presentes en codigo.
- No se asumen procesos de negocio externos al sistema (ERP externo, facturacion avanzada) si no estan implementados.
