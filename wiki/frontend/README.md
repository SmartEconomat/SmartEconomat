# Documentación del Proyecto - SmartEconomat

Esta carpeta contiene la documentación técnica y de diseño (UX/UI) del frontend.

## Estructura

### Hooks Responsive

- [useBreakpoints](./useBreakpoints.md): Hook centralizado de breakpoints. Expone `isMobile`, `isTablet`, `isDesktop` y rangos compuestos. **Todos los componentes deben usarlo en lugar de llamar a `useMediaQuery` directamente.**

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
- [PageToolbar](./componentes/PageToolbar.md): Encabezado unificado sticky con búsqueda, filtros, paginación y acciones.
- [Settings Menu](./componentes/SettingsMenu.md): Menú de configuración (Tema, Fuentes).
- [ProductFilters](./componentes/ProductFilters.md): Autocomplete multi-select de categorías con búsqueda en tiempo real, chips con icono oficial dentro del control e integración en `PageToolbar`.

#### Autenticación
- [Login](./componentes/Login.md): Orquestador de la pantalla de auth — fases, animaciones y flujos de login/registro.
- [AuthSlide](./componentes/AuthSlide.md): Panel informativo con gradiente animado, icono giratorio y carrusel.
- [LoginForm](./componentes/LoginForm.md): Formulario de inicio de sesión con toggle de contraseña.
- [RegisterForm](./componentes/RegisterForm.md): Formulario de alta de nuevos usuarios.

---

### Páginas

Documentación de las vistas completas (componentes raíz de cada ruta).

- [Auth (Login / Registro)](./paginas/Auth.md): Sistema completo de autenticación — diseño, animaciones, seguridad y flujos.
- [Dashboard / Inicio](./paginas/Dashboard.md): Vista principal con KPIs, actividad reciente, acciones rápidas y permisos granulares.
- [Usuarios](./paginas/Usuarios.md): Gestión de usuarios con tabla y operaciones CRUD.
- [Productos](./paginas/Productos.md): Catálogo de productos — búsqueda, filtrado por categoría, CRUD completo con vistas lista/mosaico e integración de `PageToolbar`.
- [Proveedores](./paginas/Proveedores.md): Listado de proveedores con detalle expandido y gestión de contactos.
- [Recetas](./paginas/Recetas.md): Gestión de escandallos y elaboración de platos.
- [Pedidos](./paginas/Pedidos.md): Órdenes de compra a proveedores con seguimiento de estados.
- [Perfil](./paginas/Perfil.md): Gestión de datos personales, seguridad y herramientas académicas por rol.
- [Incidencias](./paginas/Incidencias.md): Registro y seguimiento de problemas técnicos o de stock.
- [Movimientos](./paginas/Movimientos.md): Histórico de entradas y salidas de almacén.

---

_Esta documentación debe actualizarse cada vez que se cree o modifique sustancialmente un componente._
