# Frontend

Esta sección documenta la arquitectura y las piezas principales del cliente React + Vite. El objetivo es mantener una referencia de UI alineada con la implementación actual, no con versiones históricas de pantallas o componentes.

## Documentos base

- [Arquitectura frontend (runbook)](../architecture/frontend.md): visión general del cliente.
- [accessibility.md](accessibility.md): guía maestra de accesibilidad y atajos de teclado.
- [hooks-permisos.md](hooks-permisos.md): consumo de permisos desde el cliente.
- [useBreakpoints.md](useBreakpoints.md): responsive centralizado.
- [gestion-usuarios.md](gestion-usuarios.md): comportamiento del módulo de administración de usuarios.

## Componentes transversales

| Documento | Uso principal |
| --- | --- |
| [componentes/SkipLinks.md](componentes/SkipLinks.md) | Enlaces de salto rápido para accesibilidad por teclado |
| [componentes/MainLayout.md](componentes/MainLayout.md) | Shell principal de la aplicación |
| [componentes/PageToolbar.md](componentes/PageToolbar.md) | Cabecera reutilizable con búsqueda, filtros y acciones |
| [componentes/DataTable.md](componentes/DataTable.md) | Tablas y vistas list/grid reutilizables |
| [componentes/DetailModal.md](componentes/DetailModal.md) | Vista de detalle de entidades |
| [componentes/ConfirmDialog.md](componentes/ConfirmDialog.md) | Confirmaciones de acciones críticas |
| [componentes/DynamicFormModal.md](componentes/DynamicFormModal.md) | Infraestructura genérica de formularios; varios módulos ya usan wrappers especializados encima |
| [componentes/Login.md](componentes/Login.md) | Orquestación visual del acceso |
| [componentes/ProductFilters.md](componentes/ProductFilters.md) | Filtros del catálogo de productos |
| [componentes/RecetaIngredientesSelector.md](componentes/RecetaIngredientesSelector.md) | Selección de ingredientes para recetas |

## Modelo de sesión y permisos

- El transporte HTTP base usa `credentials: 'include'`.
- La sesión se rehidrata con `GET /api/v1/usuarios/perfil`.
- Los hooks de permisos del frontend reflejan la lógica de roles elevados del backend.
- `DynamicFormModal` sigue existiendo, pero productos, recetas y usuarios ya no dependen de él como formulario principal.

## Páginas documentadas

| Documento | Área |
| --- | --- |
| [paginas/Auth.md](paginas/Auth.md) | Login, registro y flujos de autenticación |
| [paginas/Dashboard.md](paginas/Dashboard.md) | Inicio, KPIs y acciones rápidas |
| [paginas/Usuarios.md](paginas/Usuarios.md) | Administración de usuarios y privilegios |
| [paginas/Productos.md](paginas/Productos.md) | Catálogo, exportación y alta de producto |
| [paginas/Proveedores.md](paginas/Proveedores.md) | Gestión de proveedores |
| [paginas/Recetas.md](paginas/Recetas.md) | Recetas, preparación y pedidos derivados |
| [paginas/Pedidos.md](paginas/Pedidos.md) | Flujo de pedidos y compras |
| [paginas/Perfil.md](paginas/Perfil.md) | Perfil y seguridad del usuario |
| [paginas/Incidencias.md](paginas/Incidencias.md) | Registro y seguimiento de incidencias |
| [paginas/Movimientos.md](paginas/Movimientos.md) | Histórico de movimientos |

## Servicios documentados

- [servicios/usuarioService.md](servicios/usuarioService.md)
- [servicios/profesor.service.md](servicios/profesor.service.md)

## Relacionado

- [Arquitectura frontend](../architecture/frontend.md)
- [Referencia de API](../reference/api/README.md)
- [RBAC técnico](../security/rbac.md)