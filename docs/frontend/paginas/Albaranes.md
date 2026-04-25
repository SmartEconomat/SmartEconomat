# Página: Gestión de Albaranes

**Ruta:** `/albaranes`
**Ubicación:** `src/pages/Albaranes.tsx`

## Propósito
La página de Albaranes centraliza la documentación fiscal y logística enviada por los proveedores. Su objetivo es digitalizar la prueba física de entrega para asegurar que el inventario registrado en el sistema tiene un respaldo documental verificable para contabilidad y auditoría.

## Componentes Utilizados
- **AlbaranesToolbar**: Herramientas para el registro manual y filtros de búsqueda por proveedor o fecha.
- **AlbaranUploadAction**: Componente de subida de archivos (PDF/Imagen) con previsualización.
- **AlbaranViewLightbox**: Visor responsivo de documentos adjuntos.
- **[InteractiveTour](../componentes/InteractiveTour.md)**: Guía interactiva por el flujo documental.

## Asistencia Documental ✅

El módulo cuenta con un sistema de ayuda para facilitar la digitalización:

### Tour de Gestión de Albaranes (5 pasos)
1. **Gestión de Albaranes**: Introducción a la administración de documentos.
2. **Registro Manual**: Cómo dar de alta un albarán sin archivo digital aún.
3. **Almacenamiento Digital**: Proceso de subida de fotos o PDFs.
4. **Control de Concordancia**: Verificación de datos entre albarán y sistema.
5. **Historial y Consulta**: Uso del visor para revisar documentos pasados.

## Funcionalidades Clave
- **Vinculación con Recepciones**: Permite asociar uno o varios albaranes a una recepción de mercancía específica para cerrar el ciclo logístico.
- **Validación Automática**: El sistema alerta si el número de albarán ya existe para evitar registros duplicados de un mismo proveedor.
- **Visor Integrado**: Permite leer y descargar los documentos sin salir de la plataforma.

## Servicios Consumidos
| Método | Endpoint | Uso |
| :--- | :--- | :--- |
| GET | `/albaranes` | Listado histórico de documentos registrados. |
| POST | `/albaranes` | Creación de registro y subida de archivo adjunto. |
| GET | `/albaranes/:id/archivo` | Descarga/Visualización del documento digitalizado. |
