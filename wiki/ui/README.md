# Documentación del Proyecto - SmartEconomat

Esta carpeta contiene la documentación técnica y de diseño (UX/UI) del frontend.

## Estructura

### Arquitectura

- [Arquitectura General](./arquitectura.md): Visión global del proyecto, estructura de carpetas y principios de diseño.

### Componentes (Atomic Design)

Documentación detallada de los componentes clave, desglosando su construcción desde átomos hasta organismos.

#### Base y UI Genérica
- [Spinner](./componentes/Spinner.md): Indicador de carga dinámico y bloqueador de pantalla.
- [Modal](./componentes/Modal.md): Ventana de diálogo base reutilizable con gestión de desenfoque.
- [ConfirmDialog](./componentes/ConfirmDialog.md): Modal para intercepción y confirmación de acciones críticas.
- [ToastContainer](./componentes/ToastContainer.md): Sistema de notificaciones emergentes (Toasts).
- [DataTable](./componentes/DataTable.md): Tabla general para visualización de registros con paginación integrada.
- [Tooltip](./componentes/Tooltip.md): Componente de ayuda visual extendido.
- [StatusChip](./componentes/StatusChip.md): Indicadores de estado visuales y semánticos (Rojo, Amarillo, Verde).

#### Funcionales y Layout
- [Tutorial Onboarding](./componentes/TutorialHelper.md): Guía contextual paso a paso.
- [Main Layout](./componentes/MainLayout.md): Estructura principal (Sidebar, Header).
- [Settings Menu](./componentes/SettingsMenu.md): Menú de configuración (Tema, Fuentes).
- [Login](./componentes/Login.md): Sistema de autenticación.

---

_Esta documentación debe actualizarse cada vez que se cree o modifique sustancialmente un componente._
