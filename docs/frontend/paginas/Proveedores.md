# Página: Proveedores

> **Ubicación:** `src/pages/Proveedores.tsx`

## Propósito

La página de Proveedores permite gestionar el directorio de entidades que suministran productos al establecimiento. A diferencia de Productos, esta página utiliza exclusivamente una **vista de lista** para maximizar la legibilidad de los datos de contacto y NIF.

## Componentes Utilizados

- **[PageToolbar](../componentes/PageToolbar.md)**: Gestiona el título, búsqueda por texto (Nombre, NIF, Email) y la acción de "Nuevo Proveedor". Tiene desactivado el cambio de modo de vista.
- **[DataTable](../componentes/DataTable.md)**: Muestra la información tabular con soporte para ordenamiento por columnas.
- **[DetailModal](../componentes/DetailModal.md)**: Muestra la ficha completa del proveedor al pulsar el icono de visualización (ojo). Personalizado con la etiqueta de acción **"Editar proveedor"**.
- **[DynamicFormModal](../componentes/DynamicFormModal.md)**: Formulario para creación y edición de datos fiscales y de contacto.
- **[ConfirmDialog](../componentes/ConfirmDialog.md)**: Validación para la eliminación de proveedores.
- **[InteractiveTour](../componentes/InteractiveTour.md)**: Proporciona la guía paso a paso por el módulo.

## Ayuda y Tutoriales

La página de Proveedores incluye asistencia para la gestión administrativa del directorio:

### Tour de Directorio (6 pasos)
1. **Buscador**: Localización por NIF, Nombre o Email.
2. **Ordenado**: Organización alfabética de la lista.
3. **Registro**: Alta de nuevas entidades.
4. **Exportación PDF**: Generación de ficheros de contacto.
5. **Reporte Excel**: Descarga de base de datos para administración.
6. **Gestión Individual**: Acceso a fichas y edición.

## Funcionalidades Clave

- **Ordenamiento Local**: Las columnas son ordenables directamente en el cliente para una respuesta inmediata.
- **Detalle Expandido**: El modal de detalle organiza la información en secciones: Información Fiscal, Contacto y Ubicación.
- **Acciones Rápidas**: Visualización, Edición dedicada y Eliminación con confirmación.

## Estructura de Datos (Columnas)

| Columna | ID | Tipo | Visibilidad Responsive |
| :--- | :--- | :--- | :--- |
| Nombre | `nombre` | Texto | Siempre visible |
| NIF | `nif` | Texto | Desktop (`lg`) |
| Contacto | `contacto` | Texto | Tablet y Desktop (`sm`+) |
| Teléfono | `telefono` | Texto | Tablet y Desktop (`sm`+) |
| Email | `email` | Texto | Desktop (`lg`) |
