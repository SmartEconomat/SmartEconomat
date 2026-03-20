# 🔐 Sistema de Roles y Permisos Dinámicos - SmartEconomat

## 📋 RESUMEN EJECUTIVO

Se ha implementado un **Sistema de Roles y Permisos Dinámicos Avanzado** que reemplaza los enums estáticos por una estructura granular basada en base de datos. Este sistema permite una flexibilidad total para adaptar los accesos a las necesidades cambiantes del economato.

### ✅ Características Actuales

- ✅ **153 permisos base** granulares (formato `modulo:accion`).
- ✅ **Lógica Tripartita**: `(Permisos de Roles) + (Permisos Individuales) - (Exclusiones Explicitas)`.
- ✅ **Checklists Dinámicos**: Gestión visual de cada permiso desde el perfil de usuario.
- ✅ **Hooks Reactivos**: `usePermission` y `useAnyPermission` para una UI declarativa.
- ✅ **Caching Agresivo**: Uso de `CacheManager` con TTL de 5 min para validaciones en < 5ms.
- ✅ **Invalidación Inteligente**: El cache se limpia automáticamente al modificar roles o permisos de un usuario.
- ✅ **Sesión Verificada en Frontend**: el cliente revalida el JWT con `/usuarios/perfil` antes de confiar en los permisos persistidos.
- ✅ **Guardia de Ruta por Permiso**: las vistas protegidas bloquean navegación directa si el usuario no tiene el permiso requerido.

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### 1. Lógica de Resolución de Permisos
El `AuthPermissionsService` en el backend calcula los permisos finales de un usuario siguiendo este orden de prioridad:

1.  **Herencia de Plantilla**: Permisos definidos por el rol principal (`SUPER_ADMIN`, `PROFESOR`, etc.).
2.  **Roles Específicos**: Permisos acumulados de todos los roles asignados al usuario.
3.  **Permisos Adicionales**: Permisos otorgados individualmente al usuario (Checklist de "Permisos Extra").
4.  **Exclusiones**: Si un permiso está marcado como "Excluido" para ese usuario, se revoca aunque lo tenga por rol (Checklist de "Permisos Denegados").

### 2. Guardas y Decoradores
El sistema protege las rutas automáticamente mediante:
- `@RequirePermissions('usuarios:listar')`: Requiere que el usuario tenga el permiso exacto.
- `@RequireAnyPermission('ventas:crear', 'pedidos:crear')`: Permite el acceso si tiene al menos uno de la lista.

---

## 💻 IMPLEMENTACIÓN EN FRONTEND

La gestión de permisos en la interfaz es reactiva, pero la fuente final de verdad sigue estando en el backend.

### Fuente real de permisos en cliente

El frontend usa `user.permisos`, pero solo después de una verificación de sesión:

1. `AuthContext` detecta si existe un `token`.
2. `jwtUtils` valida estructura y expiración del JWT.
3. Si el token es utilizable, el frontend llama a `GET /api/v1/usuarios/perfil`.
4. La respuesta sustituye cualquier permiso manipulado o desactualizado en `localStorage`.

Esto evita dos problemas habituales:

- **Permisos obsoletos** tras cambios administrativos hechos desde otra sesión.
- **Permisos inyectados manualmente** en el objeto `user` persistido en navegador.

### Hooks Principal: `usePermission`
Permite ocultar o deshabilitar elementos de la UI de forma declarativa.

```tsx
const canCreate = usePermission('productos:crear');

return (
  <Button disabled={!canCreate} onClick={handleCreate}>
    Nuevo Producto
  </Button>
);
```

### Hook Múltiple: `useAnyPermission`
Útil para secciones que agrupan varias funcionalidades.

```tsx
const canManageStock = useAnyPermission(['inventario:ajustar_stock', 'movimientos:crear']);

if (!canManageStock) return null;
```

### Protección de navegación directa

`AppRouter` usa `ProtectedRoute` para todas las rutas privadas y, cuando una entrada de `menuConfig` define `permiso`, exige también ese permiso antes de renderizar la página.

- Si falla JWT o la sesión no está verificada, el usuario vuelve a `/login`.
- Si la sesión es válida pero el permiso no existe, la navegación se redirige a `/`.
- Si el token cambia mientras la app está abierta, `ProtectedRoute` fuerza `refreshUser()` antes de dejar pasar.

---

## 🎨 GESTIÓN VISUAL (Panel de Administración)

Desde la vista de **Gestión de Usuarios**, los administradores pueden:
1.  **Asignar Roles**: Seleccionar entre las plantillas disponibles.
2.  **Personalización Granular**: A través de un modal con checklists, se pueden añadir o quitar permisos específicos sin cambiar el rol global del usuario. Esto es ideal para auxiliares que necesitan una función puntual de otro departamento.
3.  **Persistir overrides individuales**: la edición de usuarios guarda `permisosAdicionalesIds` y `permisosExcluidosIds` aunque el rol principal no cambie.

---

## 📊 ESTADÍSTICAS DE PERMISOS

| Dimensión | Valor |
| :--- | :--- |
| **Total Permisos Base** | 153 |
| **Módulos Cubiertos** | 18 (Usuarios, Productos, Pedidos, Inventario, Recetas, etc.) |
| **Plantillas de Sistema** | 4 (SUPER_ADMIN, ADMINISTRADOR, PROFESOR, ALUMNO) |
| **Latencia de Validación** | < 2ms (Cache Hit) |

---

## ✅ CHECKLIST DE Mantenimiento

- [x] Ejecutar seeder (`npm run seed`) para sincronizar nuevos permisos.
- [x] Documentar permisos en frontend (Hooks implementados).
- [x] Sincronizar UI con `UsuariosView.tsx`.
- [x] Verificar sesión y permisos reales en frontend antes de renderizar vistas protegidas.
- [ ] Configurar Redis en producción para cache distribuido.

---

**🎉 SISTEMA COMPLETAMENTE INTEGRADO Y OPTIMIZADO**
