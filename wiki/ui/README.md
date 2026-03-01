# Documentación del Proyecto - SmartEconomat

Esta carpeta contiene la documentación técnica y de diseño (UX/UI) del frontend.

## Estructura

### Arquitectura

- [Arquitectura General](./arquitectura.md): Visión global del proyecto, estructura de carpetas y principios de diseño.

### Componentes (Atomic Design)

Documentación detallada de los componentes clave, desglosando su construcción desde átomos hasta organismos.

#### Base y UI Genérica
- [DynamicFormModal](./componentes/DynamicFormModal.md): Modal dinámico genérico para generación automática de formularios.
- [Select](./componentes/Select.md): Componente desplegable base de UI iterado sobre Select de MUI.
- [Spinner](./componentes/Spinner.md): Indicador de carga dinámico y bloqueador de pantalla.
- [Modal](./componentes/Modal.md): Ventana de diálogo base reutilizable con gestión de desenfoque.
- [DetailModal](./componentes/DetailModal.md): Variante modal especializada en presentación de entidades con layouts de grilla en secciones dinámicas.
- [ConfirmDialog](./componentes/ConfirmDialog.md): Modal para intercepción y confirmación de acciones críticas.
- [ToastContainer](./componentes/ToastContainer.md): Sistema de notificaciones emergentes (Toasts).
- [DataTable](./componentes/DataTable.md): Tabla general para visualización de registros con paginación integrada.
- [Tooltip](./componentes/Tooltip.md): Componente de ayuda visual extendido.
- [StatusChip](./componentes/StatusChip.md): Indicadores de estado visuales y semánticos (Rojo, Amarillo, Verde).
- [AllergenSelector](./componentes/AllergenSelector.md): Selector visual 100% responsivo para los 14 alérgenos de declaración obligatoria (UE).

#### Funcionales y Layout
- [Tutorial Onboarding](./componentes/TutorialHelper.md): Guía contextual paso a paso.
- [Main Layout](./componentes/MainLayout.md): Estructura principal (Sidebar, Header).
- [Settings Menu](./componentes/SettingsMenu.md): Menú de configuración (Tema, Fuentes).
- [ProductFilters](./componentes/ProductFilters.md): Bloque funcional de selectores condicionales y colapsables para búsquedas filtradas.

#### Autenticación
- [Login](./componentes/Login.md): Orquestador de la pantalla de auth — fases, animaciones y flujos de login/registro.
- [AuthSlide](./componentes/AuthSlide.md): Panel informativo con gradiente animado, icono giratorio y carrusel.
- [LoginForm](./componentes/LoginForm.md): Formulario de inicio de sesión con toggle de contraseña.
- [RegisterForm](./componentes/RegisterForm.md): Formulario de alta de nuevos usuarios.

---

### Páginas

Documentación de las vistas completas (componentes raíz de cada ruta).

- [Auth (Login / Registro)](./paginas/Auth.md): Sistema completo de autenticación — diseño, animaciones, seguridad y flujos.
- [Usuarios](./paginas/Usuarios.md): Gestión de usuarios con tabla y operaciones CRUD.

---

_Esta documentación debe actualizarse cada vez que se cree o modifique sustancialmente un componente._
