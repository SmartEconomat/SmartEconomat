# Iconografía: SmartEconomat UI Kit

El lenguaje visual de SmartEconomat se apoya en una iconografía minimalista y semánticamente coherente basada en **Material Symbols** (vía Material UI Icons).

---

## 🧭 Navegación del Sistema
Iconos utilizados en el sidebar y en el acceso principal a los módulos operativos.

| Icono | Nombre MUI | Módulo | Propósito |
| :--- | :--- | :--- | :--- |
| 🏠 | `HomeOutlined` | Inicio / Dashboard | Vista general y métricas. |
| 📦 | `CategoryOutlined` | Productos | Gestión del catálogo maestro. |
| 🚚 | `LocalShippingOutlined` | Proveedores | Administración de suministradores. |
| 📖 | `MenuBookOutlined` | Recetas | Consulta de escandallos y fichas. |
| 🛒 | `ShoppingCartOutlined` | Pedidos | Gestión de compras y solicitudes. |
| 📥 | `LoginOutlined` | Recepción | Registro de entradas al almacén. |
| 🔀 | `CallSplit` | Distribución | Reparto interno hacia aulas. |
| 🍳 | `RestaurantOutlined` | Preparaciones | Producción física en cocina. |
| 📄 | `AssignmentOutlined` | Albaranes | Digitalización y auditoría documental. |
| 📋 | `InventoryOutlined` | Inventario | Control de stock y existencias. |
| 🔄 | `SwapHorizOutlined` | Movimientos | Trazabilidad histórica del stock. |
| 💔 | `BrokenImageOutlined` | Mermas | Registro de pérdidas y roturas. |
| ⚠️ | `ReportProblemOutlined`| Incidencias | Gestión de problemas abiertos. |
| ⚙️ | `AdminPanelSettings` | Administración | Configuración del sistema y usuarios. |

---

## 🍎 Categorías de Producto
Iconos específicos (Filled) utilizados para identificar visualmente el tipo de mercancía en tablas y fichas.

| Icono | Nombre MUI | Categoría |
| :--- | :--- | :--- |
| 🌿 | `Grass` | Verdura / Hortaliza |
| 🍎 | `Apple` | Fruta |
| 🍔 | `LunchDining` | Carne |
| 🐟 | `SetMeal` | Pescado |
| 🥣 | `RiceBowl` | Marisco |
| 🥛 | `LocalDrink` | Lácteo |
| 🥚 | `Egg` | Huevo |
| 🌾 | `Grain` | Cereal / Harina |
| 🪴 | `Spa` | Legumbre |
| 🍃 | `EnergySavingsLeaf` | Fruto Seco |
| 🧂 | `Kitchen` | Condimento / Especia |
| 💧 | `Opacity` | Aceite / Líquido Graso |
| 🍦 | `Icecream` | Azúcar / Dulce |
| 🍹 | `LocalBar` | Bebida |
| 📁 | `Category` | Otros / Genérico |

---

## 🚦 Estados y Semántica
Iconos que comunican el resultado de una acción o el estado actual de una entidad.

- **Éxito (Success)**: `CheckCircle` - Pedidos entregados, recepciones conformes.
- **Advertencia (Warning)**: `WarningAmber` - Stock bajo, pedidos pendientes de aprobación, diferencias menores.
- **Información (Info)**: `InfoOutlined` - Detalles adicionales, estados en proceso.
- **Error (Error)**: `ErrorOutline` / `Cancel` - Incidencias abiertas, pedidos rechazados, errores de sistema.

---

## 🛠️ Acciones y Herramientas
Iconos estándar para la interacción con los datos.

- **Edición**: `EditOutlined`
- **Borrado**: `DeleteOutline`
- **Visualización**: `VisibilityOutlined`
- **Búsqueda/Filtro**: `FilterList`, `Search`
- **Documentos**: `PictureAsPdf` (Exportar PDF), `FileDownload` (Excel/CSV)
- **Escaneo**: `QrCodeScanner` / Icono de código de barras custom.
- **Gestión**: `Add` (Crear nuevo), `Close` (Cerrar modal), `History` (Ver historial).

---

> [!TIP]
> **Guía de Estilo**: Recomendamos el uso de la variante `Outlined` para navegación y acciones generales, reservando la variante `Filled` exclusivamente para los iconos de categoría de producto dentro de los `StatusChip`, para maximizar el contraste en tamaños reducidos.
