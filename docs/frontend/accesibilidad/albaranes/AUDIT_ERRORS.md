# Auditoría UX/UI: Gestión de Albaranes

Este documento registra los hallazgos de usabilidad y errores detectados en la gestión documental de proveedores de SmartEconomat.

## 🔴 Errores y Puntos de Fricción Identificados

### 1. Gestión Documental y Digitalización
- **Fragmentación del Registro**: Los usuarios percibían como un proceso doble el tener que registrar la recepción y luego adjuntar el albarán, sin entender que el albarán es el respaldo legal del movimiento.
- **Visualización de Adjuntos**: El visor de archivos (PDF/Imagen) presentaba problemas de zoom en navegadores móviles, dificultando la lectura de la letra pequeña del proveedor.
- **Concordancia de Datos**: No era evidente cómo verificar si el total del albarán coincidía con el total calculado por el sistema en la recepción vinculada.

### 2. Accesibilidad (a11y)
- **Subida de Archivos**: El área de "Drag & Drop" del `FilePicker` no era accesible mediante navegación por teclado en su totalidad.
- **Visor de Documentos**: Faltaba soporte para cerrar el visor de albaranes (Lightbox) utilizando la tecla Escape de forma consistente.

### 3. Responsividad
- **Tabla de Albaranes**: La columna de "Archivo" desplazaba el resto de datos comerciales en pantallas de menos de 1024px.
- **Formulario Manual**: El ingreso manual de datos de albarán (Número, Fecha, Importe) era tedioso en dispositivos móviles debido a la falta de optimización de los tipos de input.
