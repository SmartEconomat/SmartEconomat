# Diccionario de Casos de Uso - SmartEconomat

Este documento detalla los **Casos de Uso (UC)** del sistema SmartEconomat, describiendo su propósito funcional y su implementación técnica tanto en el frontend como en el backend.

---

## 🔐 1. Gestión de Usuarios y Control de Acceso (RBAC)
**Propósito**: Garantizar que solo el personal autorizado acceda a las funciones críticas del economato.

- **Descripción**: El sistema permite el registro, acceso y gestión de perfiles de usuarios con roles específicos (`ADMINISTRADOR`, `PROFESOR`, `ALUMNO`).
- **Explicación Técnica**:
    - **Backend**: Autenticación basada en `Passport.js` y `JWT`. Autorización mediante `Guards` globales y decoradores `@Roles`.
    - **Frontend**: Los componentes de navegación y acciones críticas están protegidos mediante el `AuthContext`. El menú lateral se adapta dinámicamente según el rol detectado en el token.
    - **Seguridad**: Persistencia de contraseñas con `bcrypt` y validación de sesiones.

## 📦 2. Ciclo de Vida de Pedidos a Proveedores
**Propósito**: Gestionar la adquisición de mercancía desde la solicitud inicial hasta la recepción.

- **Descripción**: El `ADMINISTRADOR` o `PROFESOR` crea órdenes de compra, vinculando productos específicos a proveedores y gestionando el estado de los mismos.
- **Explicación Técnica**:
    - **Lógica de Estados**: Un pedido transita por: `PENDIENTE` → `EN_PROCESO` → `PARCIAL` → `RECIBIDO`/`INCIDENCIA`.
    - **Frontend**: Interfaz optimizada para la creación multilínea de productos mediante buscadores de catálogo.
    - **Backend**: Integridad referencial en la tabla `PedidoProducto` vinculada a `ProductoProveedor`.

## 📥 3. Recepción Inteligente de Mercancía (Wizard)
**Propósito**: Formalizar el ingreso de stock de forma eficiente y segura, minimizando errores manuales.

- **Descripción**: Flujo guiado para recepcionar uno o varios pedidos simultáneamente. Permite el escaneo de códigos de barras y la detección de mermas.
- **Lógica de Frontend**:
    - **Asistente (Stepper)**: Selección de pedidos → Escaneo y Conteo → Revisión → Finalización.
    - **Escaneo de Código de Barras**: Al escanear un EAN-13, el frontend busca coincidencias en los pedidos seleccionados para autoincrementar la cantidad recibida.
    - **Productos Espontáneos**: Permite añadir productos que no estaban en el pedido original (el sistema crea el vínculo `ProductoProveedor` al vuelo).
    - **Borradores (Drafts)**: El progreso se guarda automáticamente en `localStorage` para prevenir pérdida de datos por cierres accidentales.
- **Explicación Backend**:
    - Se utiliza el `RecepcionStockService` para una transacción atómica que afecta a `Recepcion`, `Inventario`, `Movimiento` y `Pedido`.

## 🔄 4. Trazabilidad y Auditoría de Movimientos
**Propósito**: Mantener un registro inalterable de cada unidad almacenada.

- **Descripción**: Toda alteración de stock (entrada por compra, salida por consumo, ajuste manual, merma) genera un registro auditable.
- **Explicación Técnica**:
    - **Tipos de Movimiento**: `ENTRADA`, `SALIDA`, `AJUSTE`, `ENTRADA_COMPRA`.
    - **Trazabilidad**: El sistema permite filtrar el historial completo de un producto para detectar dónde y cuándo se produjo una pérdida u olvido de registro.

## 💰 5. Gestión del Catálogo y Precios Proveedor
**Propósito**: Mantener la información comercial de los productos actualizada.

- **Descripción**: Gestión de la ficha técnica de los productos y los precios pactados con cada proveedor.
- **Explicación Técnica**:
    - **Normalización**: Un `Producto` (entidad base) puede tener múltiples `ProductoProveedor` (relación comercial).
    - **Control de Precios**: Cada cambio de precio genera un registro en `HistorialPrecio`, permitiendo análisis de coste por proveedor a lo largo del tiempo.
    - **Alta Compleja**: El alta de catálogo soporta crear en una sola transacción el `Producto`, sus `ProductoAlergeno` y sus relaciones `ProductoProveedor`, o bien completar el flujo posteriormente con `PATCH /productos/:id`.

> Ver detalle técnico en [Alta compleja de producto](../../modules/producto/alta-compleja-producto-maestro-proveedores.md).

## 🗳️ 6. Gestión Directa de Inventario
**Propósito**: Permite realizar inventariado manual o ajustes de stock sin pasar por un flujo de pedido.

- **Descripción**: Añadir stock directamente, definir stock mínimo/máximo de seguridad y asignar ubicaciones físicas.
- **Explicación Técnica**:
    - **Agregación en Frontend**: La vista de inventario suma todas las unidades de diferentes lotes/proveedores para mostrar el "Stock Total" por producto base.
    - **Validaciones**: El frontend impide guardar cantidades negativas o incoherentemente menores al mínimo de seguridad sin mostrar una alerta visual.

## 🔔 7. Sistema de Alertas Proactivas
**Propósito**: Detección inmediata de riesgos operativos.

- **Descripción**: Notificaciones en el dashboard sobre productos próximos a caducar o por debajo del stock de seguridad.
- **Explicación Técnica**:
    - **Home Dashboard**: Centraliza los KPIs obtenidos del `DashboardService`.
    - **Lógica**: Consultas en tiempo real que comparan `cantidadActual` vs `cantidadMinima` y `fechaCaducidad` vs la fecha actual.

## 📍 8. Organización Logística (Ubicaciones)
**Propósito**: Optimizar la localización física de los productos.

- **Descripción**: Creación y gestión de zonas del almacén (Nevera 1, Estante A2, Almacén Secos).
- **Explicación Técnica**:
    - **Entidad**: `Ubicacion`. El sistema permite el borrado lógico y la restauración de ubicaciones.
    - **Asociación**: Cada ítem en `Inventario` "vive" en una ubicación, facilitando inventarios por zona física.

## 🍳 9. Gestión de Recetas y Alergenos
**Propósito**: Facilitar la planificación culinaria cumpliendo con la normativa de seguridad alimentaria.

- **Descripción**: Creación de recetas con sus ingredientes y visualización automática de alérgenos heredados de los productos base.
- **Explicación Técnica**:
    - **Composición**: many-to-many entre `Receta` y `Producto` mediante la tabla intermedia `RecetaIngrediente`.
    - **Integración**: Permite conocer el impacto en el stock si se decide "cocinar" una receta (salida de inventario programada).

## 📊 10. Dashboard de Control (KPIs)
**Propósito**: Ofrecer una visión de alto nivel del estado económico del economato.

- **Descripción**: Valoración económica del stock, contabilización de pedidos activos e incidencias pendientes.
- **Explicación Técnica**:
    - **Servicio**: `DashboardService`. Centraliza la lógica de reporte para evitar sobrecarga de peticiones individuales desde la UI.

## 📄 11. Documentación Administrativa e Incidencias
**Propósito**: Soporte para la reconciliación de datos con proveedores externos.

- **Descripción**: Registro de Albaranes e Incidencias detectadas durante la recepción.
- **Explicación Técnica**:
    - **Incidencias**: Generación automática de discrepancias si la cantidad recibida no coincide con el pedido (tipos: `FALTA`, `EXCESO`, `DEFECTUOSO`).
    - **Albaranes**: Registro del documento físico en la entidad `Albaran` vinculado a la `Recepcion`.

## 👥 13. Gestión de Estructura Educativa (Cursos y Clases)
**Propósito**: Organizar la jerarquía académica para vincular alumnos y profesores de forma ordenada.

- **Descripción**: El profesor define sus cursos y clases, estableciendo cupos y generando códigos de acceso. El alumno se registra mediante estos códigos.
- **Detalles**: Ver [Caso de Uso: Estructura Educativa](./estructura-educativa.md) para más detalles técnicos.

## 👤 12. Gestión de Perfil de Usuario
**Propósito**: Permitir a los usuarios gestionar su propia información y credenciales.

- **Descripción**: El usuario puede ver su perfil, actualizar datos personales (nombre) y cambiar su contraseña de forma segura.
- **Detalles**: Ver [Caso de Uso: Perfil de Usuario](./perfil-usuario.md) para más detalles técnicos.
