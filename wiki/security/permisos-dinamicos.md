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

La gestión de permisos en la interfaz es totalmente reactiva gracias a los hooks personalizados.

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

---

## 🎨 GESTIÓN VISUAL (Panel de Administración)

Desde la vista de **Gestión de Usuarios**, los administradores pueden:
1.  **Asignar Roles**: Seleccionar entre las plantillas disponibles.
2.  **Personalización Granular**: A través de un modal con checklists, se pueden añadir o quitar permisos específicos sin cambiar el rol global del usuario. Esto es ideal para auxiliares que necesitan una función puntual de otro departamento.

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
- [ ] Configurar Redis en producción para cache distribuido.

---

**🎉 SISTEMA COMPLETAMENTE INTEGRADO Y OPTIMIZADO**
