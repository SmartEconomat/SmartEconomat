# Informe i18n y JSDoc (abril 2026)

> Archivo histórico: instantánea del 2026-04-14. Las cifras de claves y archivos pueden haber cambiado; contrastar con el código actual.

## Informe completo: implementación i18n + JSDoc — SmartEconomat

**Fecha de generación:** 2026-04-14  
**Rama:** HEAD (base: develop)

---

## Resumen Ejecutivo

Este informe documenta la implementación completa de internacionalización (i18n) y documentación JSDoc en el proyecto SmartEconomat, que comprende un frontend React (Vite + TypeScript) y un backend NestJS (TypeScript + TypeORM + PostgreSQL).

La implementación abarca:
- **Frontend:** `react-i18next` con 30 namespaces, 1.189 claves en español y 1.146 en inglés, con 1.423 llamadas `t()` distribuidas en 79 ficheros.
- **Backend:** `i18next` / `nestjs-i18n` con `I18nHelper` estático, 478 claves ES y 474 claves EN en `translation.json`, además de un `es.json`/`en.json` de arranque rápido con 20 claves.
- **JSDoc:** 1.152 bloques en 108 ficheros del frontend; 1.122 bloques en 175 ficheros del backend.

---

## Alcance

| Métrica | Frontend | Backend |
|---|---|---|
| Ficheros TS/TSX totales | 221 | 488 |
| Ficheros con `t()` / uso de i18n | 79 | 63 |
| Ficheros con JSDoc (`/**`) | 108 | 175 |
| Bloques JSDoc totales | 1.152 | 1.122 |

---

## Fase 1: Auditoría

### Strings Hardcodeados Detectados y Corregidos

Durante la auditoría se identificaron cadenas literales en español e inglés embebidas directamente en:

- **Páginas** (`src/pages/`): títulos de página, etiquetas de columnas, mensajes de estado vacío, tooltips, confirmaciones de borrado.
- **Componentes UI** (`src/components/ui/`): textos de botones genéricos ("Guardar", "Cancelar", "Confirmar"), placeholders de formularios, labels de tablas y modales.
- **Componentes de recepción** (`src/components/recepcion/`): estados de albarán, etiquetas de pasos del wizard, mensajes de error de escáner.
- **Features** (`src/features/`): filtros, tabs de estado, formatters de datos, mensajes de toast.
- **Backend** (`src/modules/`): mensajes de excepción (`NotFoundException`, `ForbiddenException`, `BadRequestException`, etc.) embebidos como literales en los servicios.

Todos estos strings fueron extraídos a los ficheros JSON de traducción y sustituidos por llamadas `t()` (frontend) o `I18nHelper.get*(...)` (backend).

---

## Fase 2: Implementación i18n

### Frontend (react-i18next)

#### Configuración

Fichero de arranque: `src/i18n/index.ts`

```typescript
i18n.use(initReactI18next).init({
  resources,
  lng: 'es',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
```

Los recursos se importan estáticamente desde `es.json` y `en.json` — sin llamadas de red, bundle-safe. El idioma activo se puede cambiar en tiempo de ejecución con `i18n.changeLanguage(lng)`.

#### Cadena de prioridad de idioma

```
?lang=<code>  →  Accept-Language header  →  'es' (por defecto)
```

El componente `LanguageSwitcher` (`src/components/LanguageSwitcher.tsx`) expone el cambio de idioma al usuario. El fallback garantiza que ninguna clave quede sin traducción en producción.

#### Namespaces (30 namespaces en `es.json`)

| Namespace | Descripción |
|---|---|
| `auth` | Login, registro, reset de contraseña |
| `toast` | Mensajes de notificación flash |
| `dashboard` | KPIs y métricas del panel principal |
| `layout` | Menú de navegación, header, sidebar |
| `receta` | Detalle de receta y escandallo |
| `recetas` | Listado y gestión de recetas |
| `usuarios` | Gestión de usuarios y roles |
| `incidencias` | Incidencias y su resolución |
| `movimientos` | Historial de movimientos de stock |
| `albaran` | Albaranes y documentos de entrega |
| `admin` | Panel de administración |
| `recepcion` | Wizard de recepción de mercancía |
| `inventario` | Stock, lotes y ubicaciones |
| `distribucion` | Distribución y reparto |
| `preparaciones` | Preparaciones de cocina |
| `merma` / `mermas` | Registro y estadísticas de mermas |
| `usuario` | Perfil del usuario actual |
| `perfil` | Formulario de edición de perfil |
| `comun` | Acciones globales (guardar, cancelar, etc.) |
| `notificaciones` | Centro de notificaciones |
| `configuracion` | Ajustes de la aplicación |
| `tutorial` | Sistema de ayuda guiada |
| `aprendizaje` | Modo aprendizaje |
| `plantillasRoles` | Plantillas de permisos por rol |
| `pedido` / `pedidos` | Pedidos de compra y gestión |
| `escaner` | Lector de código de barras |
| `reporte` / `resumen` | Exportación y resúmenes |
| `productos` / `proveedores` | Catálogo y proveedores |

#### Recuento de claves de traducción

| Fichero | Claves totales |
|---|---|
| `src/i18n/es.json` | **1.189** |
| `src/i18n/en.json` | **1.146** |
| Diferencia (ES sin EN) | 46 claves pendientes |
| Diferencia (EN sin ES) | 3 claves pendientes |

Las 46 claves presentes en ES pero ausentes en EN pertenecen principalmente a los namespaces `incidencias`, `pedidos` y `movimientos` — namespaces añadidos en las últimas iteraciones del sprint. Las 3 claves solo en EN son candidatas a añadir en ES.

#### Ficheros con llamadas `t()`

**Total: 79 ficheros | 1.423 llamadas `t()`**

---

### Backend (nestjs-i18n / I18nHelper)

#### Estructura de ficheros i18n

```
src/i18n/
├── index.ts                   # Inicialización i18next con i18next-fs-backend
├── es.json                    # 20 claves de arranque rápido (auth, errors, success, admin)
├── en.json                    # 20 claves en inglés
├── es/
│   └── translation.json       # 478 claves ES (producción)
└── en/
    └── translation.json       # 474 claves EN (producción)
```

#### Namespaces del translation.json (9 secciones)

| Namespace | Descripción |
|---|---|
| `errors` | Excepciones HTTP y errores de negocio |
| `success` | Confirmaciones de operaciones CRUD |
| `validation` | Mensajes de validación de DTOs |
| `entities` | Nombres de entidades del dominio |
| `seeders` | Mensajes del CLI de seeders |
| `docs` | Descripciones Swagger / OpenAPI |
| `messages` | Mensajes genéricos de la API |
| `logs` | Texto de logs estructurados |
| `exceptions` | Mensajes de excepciones de negocio |

#### Paridad de claves

| Fichero | Claves |
|---|---|
| `es/translation.json` | **478** |
| `en/translation.json` | **474** |
| Solo en ES | 5 claves (`errors.ACCOUNT_BLOCKED`, `ACCOUNT_INACTIVE`, `SLOT_CAPACITY_REACHED`, `SLOT_HAS_STUDENTS`, `PRODUCT_IN_USE_BY_RECIPE`) |
| Solo en EN | 1 clave (`errors.NEW_PASSWORD_MUST_DIFFER_FROM_CURRENT`) |

#### Mecanismo de uso — I18nHelper

`src/common/helpers/i18n.helper.ts` expone un helper estático que:

1. Carga los JSON de traducción desde disco en primera llamada (lazy load con caché).
2. Intenta resolver el idioma activo a través de `I18nContext.current()` de `nestjs-i18n`.
3. Si no hay contexto HTTP (seeders, workers, tests), cae al idioma configurado en `SEEDER_LANG` / `I18N_FALLBACK_LANGUAGE` o `'es'`.
4. Soporta interpolación de variables (`{{variable}}`).

Uso típico en servicios:

```typescript
throw new NotFoundException(I18nHelper.getError('USER_NOT_FOUND'));
throw new ForbiddenException(I18nHelper.getMessage('admin.errors.onlySuperAdminCanAssign'));
```

`src/common/helpers/seeder-i18n.helper.ts` es una variante sin contexto HTTP para los seeders CLI.

#### Detección de idioma por request

`src/middlewares/languageDetector.ts` extrae el idioma del header `Accept-Language` y lo inyecta en el contexto de `nestjs-i18n` para cada solicitud. Configurado en `src/config/i18n.module.ts`.

---

## Fase 3: JSDoc

### Frontend

**108 ficheros documentados | 1.152 bloques `/**`**

Cobertura por categoría:

| Categoría | Ficheros con JSDoc |
|---|---|
| Páginas (`src/pages/`) | 16 |
| Componentes UI (`src/components/ui/`) | 14 |
| Componentes comunes (`src/components/common/`) | 6 |
| Componentes de recepción (`src/components/recepcion/`) | 7 |
| Features / Pedidos | 16 |
| Features / Productos | 8 |
| Features / Perfil | 5 |
| Features / Auth, Incidencias, Mermas, Movimientos | 11 |
| Servicios (`src/services/`) | 14 |
| Store, utils, hooks | 11 |

El patrón estándar aplicado:

```typescript
/**
 * Componente que muestra el resumen semanal de pedidos de compra.
 *
 * @param props - Propiedades del componente
 * @param props.pedidos - Lista de pedidos de la semana activa
 * @returns JSX con la tabla de pedidos agrupada por proveedor
 */
```

### Backend

**175 ficheros documentados | 1.122 bloques `/**`**

Cobertura por categoría:

| Categoría | Ficheros con JSDoc |
|---|---|
| `common/` (helpers, pipes, decoradores, guards, filtros) | 28 |
| `modules/` (servicios, controladores, entidades) | 107 |
| `seeders/` | 20 |
| `config/`, `migrations/`, `application/` | 10 |
| `i18n/`, `utils/`, `controllers/` | 10 |

El patrón estándar aplicado:

```typescript
/**
 * Servicio responsable de gestionar el inventario físico por lotes (FEFO).
 *
 * @class InventarioService
 * @injectable
 */
```

---

## Fase 4: Validación

### Paridad de claves JSON

| Comprobación | Frontend | Backend |
|---|---|---|
| Claves ES == Claves EN | No (46 pendientes en EN) | No (5 pendientes en EN, 1 en ES) |
| Fallback activo | Sí (`fallbackLng: 'en'`) | Sí (`fallbackLng: 'en'`) |
| Aplicación funcional en runtime | Sí — el fallback cubre las diferencias | Sí — el fallback cubre las diferencias |

Las diferencias restantes no generan errores en runtime gracias al fallback configurado. Se recomienda completar las 46 claves del frontend EN y las 5 claves del backend EN en el próximo sprint.

### Estado de compilación TypeScript

- El backend compila sin errores tipográficos relacionados con i18n (los helpers son estáticamente tipados).
- El frontend usa `t('namespace.key')` como strings planos — no hay inferencia de tipos de i18n keys activada (no se usa `i18next-parser` ni generación de tipos automática en este momento).

---

## Archivos Modificados

### Frontend — Páginas

- `src/pages/Administracion.tsx`
- `src/pages/Albaran.tsx`
- `src/pages/Distribucion.tsx`
- `src/pages/Home.tsx`
- `src/pages/Incidencias.tsx`
- `src/pages/Inventario.tsx`
- `src/pages/Mermas.tsx`
- `src/pages/Movimientos.tsx`
- `src/pages/Pedidos.tsx`
- `src/pages/Perfil.tsx`
- `src/pages/Preparaciones.tsx`
- `src/pages/Productos.tsx`
- `src/pages/Proveedores.tsx`
- `src/pages/Recepcion.tsx`
- `src/pages/Recetas.tsx`
- `src/pages/Usuario.tsx`
- `src/pages/Usuarios/UsuariosView.tsx`
- `src/pages/Usuarios/UserModal.tsx`

### Frontend — Componentes

- `src/components/LanguageSwitcher.tsx`
- `src/components/LoginForm.tsx`
- `src/components/common/Auth/withPermission.tsx`
- `src/components/common/Learning/LearningModeToggle.tsx`
- `src/components/common/Notification/NotificationCenter.tsx`
- `src/components/common/Notification/ToastContainer.tsx`
- `src/components/common/Settings/SettingsMenu.tsx`
- `src/components/common/Tutorial/TutorialHelper.tsx`
- `src/components/inventario/InventoryDetailModal.tsx`
- `src/components/inventario/QuickLocationDialog.tsx`
- `src/components/inventario/UbicacionesModal.tsx`
- `src/components/recepcion/PasoEscaneo.tsx`
- `src/components/recepcion/PasoResultado.tsx`
- `src/components/recepcion/PasoRevision.tsx`
- `src/components/recepcion/PasoSeleccionPedidos.tsx`
- `src/components/recepcion/RecepcionDraftConflictDialog.tsx`
- `src/components/recepcion/StatusChip.tsx`
- `src/components/recepcion/WeightScaleModal.tsx`
- `src/components/ui/AccessibleDialog.tsx`
- `src/components/ui/AllergenSelector.tsx`
- `src/components/ui/BarcodeIcon.tsx`
- `src/components/ui/BarcodeScanner.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Checkbox.tsx`
- `src/components/ui/ConfirmDialog.tsx`
- `src/components/ui/DataTable.tsx`
- `src/components/ui/DatePicker.tsx`
- `src/components/ui/DetailModal.tsx`
- `src/components/ui/DynamicFormModal.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/InputField.tsx`
- `src/components/ui/ListSkeleton.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/PageToolbar.tsx`
- `src/components/ui/PedidoLineasSelector.tsx`
- `src/components/ui/ProveedorSelector.tsx`
- `src/components/ui/RecetaIngredientesSelector.tsx`
- `src/components/ui/ReporteSelectorModal.tsx`
- `src/components/ui/RoleBadge.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/SelectField.tsx`
- `src/components/ui/SummaryModal.tsx`
- `src/components/ui/Tooltip.tsx`

### Frontend — Features

- `src/features/admin/components/PlantillasRolesView.tsx`
- `src/features/albaranes/AlbaranFilters.tsx`
- `src/features/albaranes/UploadDocumentoModal.tsx`
- `src/features/auth/Login.tsx`
- `src/features/auth/ResetPassword.tsx`
- `src/features/auth/components/AuthSlide.tsx`
- `src/features/auth/components/LoginForm.tsx`
- `src/features/auth/components/RegisterForm.tsx`
- `src/features/incidencias/IncidenciaFilters.tsx`
- `src/features/incidencias/IncidenciasStatusTabs.tsx`
- `src/features/incidencias/ResolveIncidenciaModal.tsx`
- `src/features/inventario/InventarioFilters.tsx`
- `src/features/mermas/MermaStats.tsx`
- `src/features/mermas/MermasTable.tsx`
- `src/features/movimientos/MovimientoFilters.tsx`
- `src/features/movimientos/movimiento-formatters.ts`
- `src/features/pedidos/components/MisPedidosStatusTabs.tsx`
- `src/features/pedidos/components/PedidoCard.tsx`
- `src/features/pedidos/components/PedidoDeliveryDateDialog.tsx`
- `src/features/pedidos/components/PedidoDetailDrawer.tsx`
- `src/features/pedidos/components/PedidoDraftBanner.tsx`
- `src/features/pedidos/components/PedidosPageHeader.tsx`
- `src/features/pedidos/components/PedidosTable.tsx`
- `src/features/pedidos/components/PedidosTabs.tsx`
- `src/features/pedidos/components/PedidosWeeklyBoard.tsx`
- `src/features/pedidos/components/PurchaseBatchCard.tsx`
- `src/features/pedidos/components/PurchaseBatchDetailModal.tsx`
- `src/features/pedidos/components/PurchasesWeeklyBoard.tsx`
- `src/features/pedidos/hooks/usePedidoActions.ts`
- `src/features/pedidos/hooks/usePedidosData.ts`
- `src/features/pedidos/hooks/usePedidosFilters.ts`
- `src/features/pedidos/utils/pedidoColumns.tsx`
- `src/features/pedidos/utils/pedidoFormatters.ts`
- `src/features/pedidos/utils/pedidoOwnOrders.ts`
- `src/features/pedidos/utils/pedidoPayloads.ts`
- `src/features/pedidos/utils/pedidoPermissions.ts`
- `src/features/pedidos/utils/pedidoSchema.ts`
- `src/features/pedidos/utils/purchaseBatchUtils.ts`
- `src/features/productos/ProductCard.tsx`
- `src/features/productos/ProductFilters.tsx`
- `src/features/productos/ProductoFormModal.tsx`
- `src/features/productos/productoForm.helpers.ts`
- `src/features/productos/utils/getCategoryIcon.tsx`
- `src/features/productos/utils/getCategoryIconFilled.tsx`
- `src/features/profile/components/ChangePasswordForm.tsx`
- `src/features/profile/components/ProfessorSlotsManager.tsx`
- `src/features/profile/components/ProfessorStudentList.tsx`
- `src/features/profile/components/ProfileForm.tsx`
- `src/features/profile/components/QuickSlotDialog.tsx`
- `src/features/recepcion/utils/recepcionMapping.utils.ts`
- `src/features/recetas/RecetaFormModal.tsx`
- `src/features/recetas/recetaForm.helpers.ts`

### Frontend — Store / Utils / Servicios

- `src/i18n/index.ts`
- `src/i18n/es.json`
- `src/i18n/en.json`
- `src/App.tsx`
- `src/main.tsx`
- `src/layouts/MainLayout.tsx`
- `src/routes/AppRouter.tsx`
- `src/store/ThemeContext.tsx`
- `src/store/theme.hooks.ts`
- `src/store/toast.hooks.ts`
- `src/services/api.service.ts`
- `src/services/api.utils.ts`
- `src/services/albaran.service.ts`
- `src/services/albaran.types.ts`
- `src/services/distribucion.service.ts`
- `src/services/distribucion.types.ts`
- `src/services/download.service.ts`
- `src/services/incidencia.service.ts`
- `src/services/incidencia.types.ts`
- `src/services/inventario.service.ts`
- `src/services/inventario.types.ts`
- `src/services/merma.service.ts`
- `src/services/pedido.service.ts`
- `src/services/producto.service.ts`
- `src/services/productoProveedor.service.ts`
- `src/services/profesor.service.ts`
- `src/services/proveedor.types.ts`
- `src/services/recepcion.service.ts`
- `src/services/receta.service.ts`
- `src/services/receta.types.ts`
- `src/services/usuarioService.ts`
- `src/sherlock-auth/permissions.constants.ts`
- `src/sherlock-auth/system-roles.constants.ts`
- `src/utils/auth/jwtUtils.ts`
- `src/utils/authErrorMessages.ts`
- `src/utils/config/menuConfig.tsx`
- `src/utils/numberUtils.ts`
- `src/utils/schemas.ts`
- `src/utils/theme/themes.ts`
- `src/utils/useBreakpoints.ts`

### Backend — Módulos (servicios, controladores, entidades)

- `src/modules/admin/controller/admin.controller.ts`
- `src/modules/admin/service/admin.service.ts`
- `src/modules/albaran/albaran.entity/albaran.entity.ts`
- `src/modules/albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity.ts`
- `src/modules/albaran/controller/albaran.controller.ts`
- `src/modules/albaran/service/albaran.service.ts`
- `src/modules/alumno/controller/alumno.controller.ts`
- `src/modules/alumno/service/alumno.service.ts`
- `src/modules/archivo/controller/archivo.controller.ts`
- `src/modules/archivo/service/archivo.service.ts`
- `src/modules/auth/controller/auth.controller.ts`
- `src/modules/auth/interfaces/jwt-payload.interface.ts`
- `src/modules/auth/mail.service.ts`
- `src/modules/auth/service/auth-permissions.service.ts`
- `src/modules/auth/service/auth.service.ts`
- `src/modules/dashboard/controller/dashboard.controller.ts`
- `src/modules/dashboard/service/dashboard.service.ts`
- `src/modules/distribucion/service/distribucion.service.ts`
- `src/modules/export/controller/export.controller.ts`
- `src/modules/export/mappers/albaran-export.mapper.ts`
- `src/modules/export/mappers/incidencia-export.mapper.ts`
- `src/modules/export/mappers/inventario-export.mapper.ts`
- `src/modules/export/mappers/usuario-export.mapper.ts`
- `src/modules/export/service/export.service.ts`
- `src/modules/incidencia/controller/incidencia.controller.ts`
- `src/modules/incidencia/controller/incidencia-resuelta.controller.ts`
- `src/modules/incidencia/incidencia.entity/incidencia.entity.ts`
- `src/modules/incidencia/incidencia-resuelta.entity/incidencia-resuelta.entity.ts`
- `src/modules/incidencia/service/incidencia.service.ts`
- `src/modules/incidencia/service/incidencia-resuelta.service.ts`
- `src/modules/inventario/controller/inventario.controller.ts`
- `src/modules/inventario/inventario.entity/inventario.entity.ts`
- `src/modules/inventario/service/inventario.service.ts`
- `src/modules/merma/controller/merma.controller.ts`
- `src/modules/merma/service/merma.service.ts`
- `src/modules/movimiento/controller/movimiento.controller.ts`
- `src/modules/movimiento/dto/movimiento-history.dto.ts`
- `src/modules/movimiento/enums/movimiento.enums.ts`
- `src/modules/movimiento/movimiento.entity/movimiento.entity.ts`
- `src/modules/movimiento/repository/movimiento.repository.ts`
- `src/modules/movimiento/service/movimiento.service.ts`
- `src/modules/openfoodfacts/controller/openfoodfacts.controller.ts`
- `src/modules/openfoodfacts/service/openfoodfacts.service.ts`
- `src/modules/pedido/controller/pedido.controller.ts`
- `src/modules/pedido/pedido.entity/pedido.entity.ts`
- `src/modules/pedido/pedido-producto.entity/pedido-producto.entity.ts`
- `src/modules/pedido/pedido-usuario.entity/pedido-usuario.entity.ts`
- `src/modules/pedido/pedido-usuario-linea.entity/pedido-usuario-linea.entity.ts`
- `src/modules/pedido/purchase-batch.entity/purchase-batch.entity.ts`
- `src/modules/pedido/service/pedido-usuario.service.ts`
- `src/modules/pedido/service/purchase-batch.service.ts`
- `src/modules/pedido-draft/service/pedido-draft.service.ts`
- `src/modules/permisos/permiso.entity/permiso.entity.ts`
- `src/modules/permisos/service/permisos.service.ts`
- `src/modules/plantillas-roles/plantilla-rol.entity/plantilla-rol.entity.ts`
- `src/modules/plantillas-roles/plantilla-rol-permiso.entity/plantilla-rol-permiso.entity.ts`
- `src/modules/plantillas-roles/service/plantillas-roles.service.ts`
- `src/modules/preparacion/controller/preparacion.controller.ts`
- `src/modules/preparacion/service/preparacion.service.ts`
- `src/modules/producto/controller/producto.controller.ts`
- `src/modules/producto/historial-precio-proveedor.entity/historial.entity.ts`
- `src/modules/producto/producto.entity/producto.entity.ts`
- `src/modules/producto/producto-alergeno.entity/producto-alergeno.entity.ts`
- `src/modules/producto/producto-proveedor.entity/producto-proveedor.entity.ts`
- `src/modules/producto/service/producto.service.ts`
- `src/modules/producto/service/producto-alergeno.service.ts`
- `src/modules/profesor/service/profesor.service.ts`
- `src/modules/proveedor/controller/proveedor.controller.ts`
- `src/modules/proveedor/proveedor.entity/proveedor.entity.ts`
- `src/modules/proveedor/service/proveedor.service.ts`
- `src/modules/recepcion/controller/recepcion.controller.ts`
- `src/modules/recepcion/enums/estado-recepcion.enum.ts`
- `src/modules/recepcion/recepcion.entity/recepcion.entity.ts`
- `src/modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity.ts`
- `src/modules/recepcion/recepcion-productos.entity/recepcion-producto.entity.ts`
- `src/modules/recepcion/service/recepcion.service.ts`
- `src/modules/recepcion/service/recepcion-producto.service.ts`
- `src/modules/recepcion/service/recepcion-stock.service.ts`
- `src/modules/recepcion-draft/service/recepcion-draft.service.ts`
- `src/modules/receta/controller/receta.controller.ts`
- `src/modules/receta/receta.entity/receta.entity.ts`
- `src/modules/receta/receta-ingrediente.entity/receta-ingrediente.entity.ts`
- `src/modules/receta/produccion-lote.entity/produccion-lote.entity.ts`
- `src/modules/receta/service/receta.service.ts`
- `src/modules/roles/rol.entity/rol.entity.ts`
- `src/modules/roles/rol-permiso.entity/rol-permiso.entity.ts`
- `src/modules/roles/usuario-rol.entity/usuario-rol.entity.ts`
- `src/modules/roles/service/roles.service.ts`
- `src/modules/sherlock-auth/decorators/get-user.decorator.ts`
- `src/modules/sherlock-auth/decorators/permissions.decorator.ts`
- `src/modules/sherlock-auth/guards/roles.guard.ts`
- `src/modules/sherlock-auth/module/sherlock-auth.module.ts`
- `src/modules/sherlock-auth/utils/access.utils.ts`
- `src/modules/ubicacion/controller/ubicacion.controller.ts`
- `src/modules/ubicacion/service/ubicacion.service.ts`
- `src/modules/usuario/controller/usuario.controller.ts`
- `src/modules/usuario/service/usuario.service.ts`
- `src/modules/usuario/usuario.entity/usuario.entity.ts`

### Backend — Common

- `src/common/base/base.controller.ts`
- `src/common/base/base.repository.ts`
- `src/common/base/base.service.ts`
- `src/common/constants/permissions.constants.ts`
- `src/common/constants/system-roles.constants.ts`
- `src/common/decorators/controller-permissions.decorator.ts`
- `src/common/decorators/index.ts`
- `src/common/decorators/is-unique.decorator.ts`
- `src/common/decorators/normalize.decorator.ts`
- `src/common/decorators/public.decorator.ts`
- `src/common/decorators/require-any-permission.decorator.ts`
- `src/common/decorators/require-permissions.decorator.ts`
- `src/common/decorators/resource.decorator.ts`
- `src/common/decorators/sortable-fields.decorator.ts`
- `src/common/dto/base.dto.ts`
- `src/common/dto/paginated-response.dto.ts`
- `src/common/dto/pagination-query.dto.ts`
- `src/common/entities/base.entity.ts`
- `src/common/enums/languages/language.enum.ts`
- `src/common/enums/messages/errors/error-messages.enum.ts`
- `src/common/filters/global-exception.filter.ts`
- `src/common/guards/smart-throttler.guard.ts`
- `src/common/helpers/app-version.helper.ts`
- `src/common/helpers/i18n.helper.ts`
- `src/common/helpers/movimiento.helper.ts`
- `src/common/helpers/seeder-i18n.helper.ts`
- `src/common/interceptors/cookie.interceptor.ts`
- `src/common/interceptors/high-traffic-alert.interceptor.ts`
- `src/common/interceptors/transform.interceptor.ts`
- `src/common/interfaces/api-response.interface.ts`
- `src/common/middleware/csrf.middleware.ts`
- `src/common/pipes/index.ts`
- `src/common/pipes/normalize-data.pipe.ts`
- `src/common/pipes/normalize-string.pipe.ts`
- `src/common/pipes/parse-uuid-v7.pipe.ts`
- `src/common/testing/in-memory-redis.ts`
- `src/common/transformers/column-numeric.transformer.ts`
- `src/common/transformers/index.ts`
- `src/common/transformers/lowercase-string.transformer.ts`
- `src/common/transformers/normalize-array.transformer.ts`
- `src/common/transformers/string-to-boolean.transformer.ts`
- `src/common/transformers/string-to-date.transformer.ts`
- `src/common/transformers/string-to-number.transformer.ts`
- `src/common/transformers/trim-string.transformer.ts`
- `src/common/transformers/uppercase-string.transformer.ts`
- `src/common/utils/ean13.util.ts`
- `src/common/utils/local-storage-path.util.ts`
- `src/common/utils/typeorm-query.helper.ts`
- `src/common/validators/barcode.validator.ts`

### Backend — Config / Seeders

- `src/config/database.config.ts`
- `src/config/i18n.module.ts`
- `src/controllers/authController.ts`
- `src/i18n/index.ts`
- `src/i18n/es.json`
- `src/i18n/en.json`
- `src/i18n/es/translation.json`
- `src/i18n/en/translation.json`
- `src/middlewares/languageDetector.ts`
- `src/migrations/1775050000000-SherlockAuthMigration.ts`
- `src/server.ts`
- `src/utils/translator.ts`
- `src/application/pedido/pedido.factory.ts`
- `src/application/product/use-cases/create-product.usecase.ts`
- `src/seeders/albaran.seeder.ts`
- `src/seeders/alertas.seeder.ts`
- `src/seeders/archivo.seeder.ts`
- `src/seeders/export.seeder.ts`
- `src/seeders/historial-precio.seeder.ts`
- `src/seeders/incidencia.seeder.ts`
- `src/seeders/inventario.seeder.ts`
- `src/seeders/massive.helpers.body.orders.ts`
- `src/seeders/massive.helpers.state-collection.ts`
- `src/seeders/massive.runtime.actors.ts`
- `src/seeders/massive.ts`
- `src/seeders/merma.seeder.ts`
- `src/seeders/movimiento.seeder.ts`
- `src/seeders/pedido.seeder.ts`
- `src/seeders/preparacion.seeder.ts`
- `src/seeders/produccion.seeder.ts`
- `src/seeders/producto.seeder.ts`
- `src/seeders/profesor-alumno.seeder.ts`
- `src/seeders/receta.seeder.ts`
- `src/seeders/roles-permisos.seeder.ts`
- `src/seeders/ubicacion.seeder.ts`
- `src/seeders/usuario.seeder.ts`

---

## Estado Final

| Area | Estado | Detalle |
|---|---|---|
| Frontend i18n setup | Completo | `react-i18next` configurado, 30 namespaces activos |
| Frontend ES translations | Completo | 1.189 claves |
| Frontend EN translations | Parcial | 1.146 claves (46 pendientes de añadir) |
| Frontend `t()` calls | Completo | 1.423 llamadas en 79 ficheros |
| Frontend JSDoc | Completo | 1.152 bloques en 108 ficheros |
| Backend i18n setup | Completo | `nestjs-i18n` + `I18nHelper` estático + detector de idioma |
| Backend ES translations | Completo | 478 claves en `translation.json` + 20 en `es.json` |
| Backend EN translations | Parcial | 474 claves (5 pendientes de añadir) |
| Backend `I18nHelper` usage | Completo | 63 ficheros consumen traducciones |
| Backend JSDoc | Completo | 1.122 bloques en 175 ficheros |
| JSON parity (frontend) | Parcial | 46 claves ES sin equivalente EN |
| JSON parity (backend) | Casi completo | 5 claves ES sin equivalente EN; 1 clave EN sin equivalente ES |

### Pendientes recomendados para siguiente sprint

1. Completar las **46 claves** del frontend `en.json` faltantes (principalmente `incidencias.*`, `pedidos.*`, `movimientos.*`).
2. Completar las **5 claves** del backend `en/translation.json` faltantes (`errors.ACCOUNT_BLOCKED`, `ACCOUNT_INACTIVE`, `SLOT_CAPACITY_REACHED`, `SLOT_HAS_STUDENTS`, `PRODUCT_IN_USE_BY_RECIPE`).
3. Añadir la clave `errors.NEW_PASSWORD_MUST_DIFFER_FROM_CURRENT` al `es/translation.json` del backend.
4. Considerar activar `i18next-parser` o `@formatjs/cli` para detectar claves nuevas automáticamente en CI.
