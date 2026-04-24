# Componentes de Albaranes

Biblioteca de componentes para la gestión documental y el respaldo físico de las recepciones de mercancía.

---

## AlbaranFilters

Sistema de búsqueda especializado para la localización de documentos de entrega.

- **Ubicación**: `src/features/albaranes/AlbaranFilters.tsx`
- **Capacidades**:
    - **Filtrado por Concordancia**: Permite aislar rápidamente albaranes marcado como "No Conformes" para revisión administrativa.
    - **Rango de Fechas**: Búsqueda temporal para conciliación de facturas a final de mes.
- **Diseño**: Alineado con el patrón de `ProductFilters`, utilizando un diseño compacto que prioriza la visibilidad de los filtros activos.

## UploadDocumentoModal

Interfaz para la digitalización y almacenamiento de documentos justificantes.

- **Ubicación**: `src/features/albaranes/UploadDocumentoModal.tsx`
- **Características**:
    - **Soporte Multiformato**: Especializado en PDFs e imágenes capturadas con dispositivos móviles.
    - **Feedback de Tamaño**: Calcula y muestra el tamaño del archivo antes de la subida para asegurar el cumplimiento de las cuotas del servidor.
    - **Barra de Progreso**: Incluye un indicador visual de carga durante la transmisión al servicio de almacenamiento central (`resolveStoredFileUrl`).

## AlbaranDetailView (Modal de Detalle)

Visor integral que enlaza el documento físico con la operación digital.

- **Ubicación**: `src/pages/Albaran.tsx` (Secciones de Detalle)
- **Información Visual**:
    - **Estado de Conformidad**: Utiliza iconos de `CheckCircleOutline` (Conforme) o `CancelOutlined` (No conforme) con colores semánticos.
    - **Enlaces de Descarga**: Provee acceso directo al archivo subido para su consulta inmediata.
    - **Trazabilidad de Recepción**: Desglosa todos los productos y recepciones asociadas a ese albarán, permitiendo navegar hacia el detalle de cada bulto recibido.

## Micro-interacciones Documentales

- **ToolTip de Tamaño**: Muestra información formateada (KB/MB) sobre los archivos adjuntos.
- **Confirmación de Borrado**: Integrado con `ConfirmDialog` para evitar la pérdida accidental de respaldo documental, acción protegida bajo el permiso `PERMISSIONS.albaranes.eliminar`.
