# Auditoría UX/UI: Gestión de Proveedores

Este documento registra los hallazgos de usabilidad y diseño en el directorio de suministros de SmartEconomat.

## 🔴 Errores y Puntos de Fricción Identificados

### 1. Gestión Administrativa
- **Dificultad en Alta Rápida**: El proceso de dar de alta un nuevo proveedor mientras se estaba creando un producto presentaba fricción, al no quedar claro si la información se persistía correctamente para su uso inmediato.
- **Búsqueda Limitada**: Los usuarios percibían el buscador como lento o ineficiente al no poder filtrar por múltiples criterios (NIF y Email) de forma combinada sin recargas.
- **Visualización de Contactos**: En la vista de lista, los datos de contacto (Email/Teléfono) se percibían como amontonados, dificultando la copia rápida de información administrativa.

### 2. Accesibilidad (a11y)
- **DataTable de Proveedores**: La navegación entre proveedores individuales no garantizaba que el foco se mantuviera en la fila seleccionada tras cerrar el modal de detalle.
- **Formularios de Registro**: El campo NIF carecía de una validación visual en tiempo real que notificara errores de formato antes del envío final.

### 3. Responsividad
- **Columnas en Móvil**: Gran parte de la información fiscal (NIF, Email) se perdía en resoluciones inferiores a 480px al no contar con un sistema de prioridad de columnas.
- **Diálogos de Ficha**: El modal de detalle del proveedor presentaba problemas de scroll vertical en dispositivos con pantalla pequeña.
