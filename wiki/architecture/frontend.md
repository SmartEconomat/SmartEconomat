Este documento describe la arquitectura del proyecto `SmartEconomat` (Frontend), basada en **React 19**, **Vite** y **Material UI (MUI)**. Diseñada siguiendo principios de escalabilidad, mantenibilidad y separación de responsabilidades.

## Estructura del Proyecto

El proyecto sigue una organización modular:

```text
src/
├── assets/            # Recursos estáticos (imágenes, fuentes, estilos globales).
├── components/        # Componentes reutilizables.
│   └── ui/            # Componentes de UI puros (Botones, Inputs) sin lógica de negocio.
├── features/          # Módulos funcionales de la aplicación (Principalmente Auth).
├── layouts/           # Estructuras de página (MainLayout, AuthLayout).
├── pages/             # Componentes de página (Vistas que contienen la mayor parte de la cohesión lógica).
├── routes/            # Configuración de enrutamiento (AppRouter, Guards).
├── services/          # Comunicación con APIs y lógica de procesamiento de datos (Fetch + wrappers compartidos).
│   └── *.types.ts     # Definiciones de tipos específicas de cada servicio.
├── store/             # Gestión de estado global (Context API).
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── ToastContext.tsx
├── types/             # Tipos compartidos globales.
├── utils/             # Funciones de utilidad y configuración.
│   ├── auth/          # Utilidades de autenticación y JWT.
│   ├── config/        # Configuraciones globales (menuConfig).
│   └── theme/         # Definiciones de tema (themes.ts).
├── App.tsx            # Componente raíz.
└── main.tsx           # Punto de entrada.

```

## Principios de Arquitectura

Seguimos tres pilares fundamentales para mantener el código limpio:

### 1. Separación de Lógica y Datos
-   **Componentes (Pages):** Se encargan de la orquestación visual y la unión de los datos con la interfaz. Gran parte de la lógica de negocio inmediata reside aquí.
-   **Services:** Encapsulan toda la comunicación con el backend (`fetch` + wrappers compartidos) y el procesamiento previo de los datos para que lleguen limpios a los componentes.
-   **Hooks:** Se utilizan para encapsular lógica reutilizable (como el estado de un formulario o la gestión de modales). *Nota: Si un componente crece en exceso, su lógica debe migrarse a hooks o services según corresponda.*

### 2. Composición de Componentes
- Priorizamos la composición (`children`) sobre el paso excesivo de propiedades ("Prop Drilling").

### 3. Colocación (Co-location)
- Recursos específicos (estilos locales, tipos específicos) viven en la misma carpeta o archivo que el componente o servicio que los usa.

### Módulos Principales (Features)

1. **Autenticación (`src/features/auth`)**: Gestión de login, registros vinculados, recuperación de contraseña y sesión verificada gobernada por backend.
2. **Productos y Catálogo**: Gestión de fichas técnicas y códigos de barras.
3. **Pedidos y Recepciones**: Flujos de compra y entrada de stock masiva/multi-pedido.
4. **Inventario y Ubicaciones**: Control físico de stock FEFO y trazabilidad.
5. **Recetas y Producción**: Escandallos, cocinado y gestión de lotes producidos.
6. **Módulo Educativo**: Panel de profesores y slots para alumnos.

## Arquitectura actual del módulo de pedidos

El frontend de pedidos ya no trabaja con un único tipo de entidad para todos los casos. La UI distingue tres capas:

### `PedidoUsuario` en vistas de negocio
- Las pestañas **Mis Pedidos** y **Pedidos** consumen `GET /pedido-usuarios`.
- `src/services/pedido.service.ts` expone `fetchPedidoUsuarios`, `createPedidoUsuario`, `updatePedidoUsuario`, `aceptarPedidoUsuario` y `cancelPedidoUsuario`.
- `mapPedidoUsuarioToPedidoRow(...)` adapta el agregado al shape visual reutilizado por tablas y tarjetas.

### `PurchaseBatch` en vistas de compras
- La pestaña **Compras** sigue consumiendo `PurchaseBatch`.
- La consolidación semanal usa `POST /purchase-batches/consolidate` enviando `pedidoUsuarioIds`.
- Los modales y visores (`PurchaseBatchDetailModal`, `BatchPedidoLineasViewer`) soportan tanto modo `batch` como modo `pedido`.

### Hooks y utilidades clave
- `usePedidosData` decide qué endpoint cargar según la pestaña activa.
- `usePedidoActions` enruta acciones completas del pedido hacia `PedidoUsuario` y deja `PurchaseBatch` solo para compras.
- `pedidoOwnOrders.ts` detecta agregados mediante `aggregateType === 'pedido_usuario'`.
- `pedidoFormatters.ts` separa el identificador técnico del número visible en lista.

### Convención visual actual
- En listas se muestra `numeroGlobal` sin prefijo, bajo la columna **N de pedido**.
- El UUID abreviado queda como identificador técnico para contextos de depuración o fallback.
- Los chips de estado aceptan estados de negocio en español: `pendiente`, `en_proceso`, `entregado`, `cancelado`, `recibido`.

## Gestión de Estado (`src/store`)
Utilizamos Context API para el estado global:
-   **AuthContext:** Gestiona el usuario autenticado, la verificación de sesión con backend y los permisos vigentes de la sesión.
-   **ThemeContext:** Controla el tema de la aplicación.
-   **ToastContext:** Gestiona las notificaciones globales del sistema.

### Flujo actual de autenticación y sesión

El frontend funciona ahora en modo **cookie-first**. La fuente real de sesión y permisos está en el backend, no en `localStorage`.

1. **Login**: `POST /api/v1/auth/login` devuelve `access_token` y el backend lo persiste en una cookie `httpOnly` llamada `access_token`.
2. **Bootstrap de app**: `AuthContext` llama a `authService.getCurrentUser()` contra `GET /api/v1/usuarios/perfil` al montar la aplicación.
3. **Sesión en memoria**: el objeto `user` vive en memoria React (`Context API`) y se reconstruye tras recarga a partir de la cookie válida.
4. **Sincronización de permisos**: los permisos efectivos se recalculan siempre en backend y sustituyen cualquier estado previo del cliente.
5. **Cierre de sesión**: `POST /api/v1/auth/logout` limpia la cookie desde backend y el cliente reinicia su estado en memoria.
6. **401 global**: `baseFetch` emite `AUTH_UNAUTHORIZED`; `AuthContext` captura ese evento y fuerza cierre de sesión limpio.

### Qué sí queda en `localStorage`

- `rememberedUser`: solo para autocompletar el identificador de login cuando el usuario marca “Recordarme”.
- `dashboard_visible_metrics`: preferencia puramente visual del usuario para ocultar o mostrar tarjetas del dashboard.

### Qué ya no se usa para sesión

- `token`
- `user`
- decodificación del `access_token` para decidir permisos, rol o navegación de sesión
- comparaciones locales de expiración JWT para decidir acceso a rutas privadas

### Protección de rutas

- **`PublicRoute`** mantiene fuera de `/login` a usuarios con sesión ya verificada.
- **`ProtectedRoute`** espera a que `AuthContext` resuelva la sesión real con backend y luego valida el permiso requerido por ruta.
- **`AppRouter`** envuelve las rutas definidas en `menuConfig` con `ProtectedRoute`, soportando tanto `requiredPermission` como `requiredAnyPermissions` para casos con acceso por múltiples capacidades válidas.
- **Resolución inicial**: mientras `isAuthResolved` es `false`, tanto rutas públicas como privadas muestran `Spinner` para evitar parpadeos o redirecciones incorrectas.

### Dashboard (`src/pages/Home.tsx`)

La ruta `/` actúa como dashboard principal y ya está integrada en el sistema de permisos y navegación real de la aplicación:

- La página exige `dashboard:ver_estadisticas` para consultar `GET /api/v1/dashboard/stats`.
- Cada tarjeta secundaria del dashboard se renderiza además con permisos granulares propios (`productos:listar`, `pedidos:listar`, `incidencias:listar`, `inventario:listar`, `proveedores:listar`).
- Las acciones rápidas reutilizan servicios existentes (`createProducto`, `createPedido`, `createReceta`) y navegación hacia `/recepciones`, evitando flujos paralelos o endpoints alternativos.
- La personalización de tarjetas visibles se guarda solo como preferencia de UI en `localStorage` mediante `dashboard_visible_metrics`; no afecta a seguridad ni sesión.
- La sección “Actividad reciente” se alimenta del mismo payload consolidado del backend, evitando peticiones adicionales por widget.

### Transporte HTTP

- `src/services/api.service.ts` usa `fetch` con `credentials: 'include'` para enviar la cookie de sesión.
- El frontend ya no inyecta `Authorization: Bearer ...` desde almacenamiento local para funcionamiento normal.
- El backend mantiene soporte dual (`cookie` y `Bearer`) por compatibilidad, pero el flujo recomendado es el basado en cookie segura.


## Navegación y Estilo
- **React Router v7**: Para el enrutamiento y guards de seguridad.
- **Material UI (MUI) v7**: Sistema de diseño basado en componentes modernos.
- **Vite**: Herramienta de construcción ultra rápida que sustituye a CRA.

---
*Este documento es un artefacto vivo y debe actualizarse con cada nueva característica implementada.*
