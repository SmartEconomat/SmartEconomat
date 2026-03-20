# 🪝 Hooks de Permisos - Frontend

Para gestionar la visibilidad y el acceso en la interfaz de usuario de forma reactiva, el sistema utiliza hooks personalizados que encapsulan la lógica de verificación de permisos.

## 📋 Hooks Disponibles

Los hooks se encuentran definidos en `src/store/auth.hooks.ts`.

### 1. `usePermission`
Verifica si el usuario autenticado tiene un permiso específico.

**Firma:**
```typescript
const hasAccess = usePermission(permiso: string | undefined): boolean;
```

**Ejemplo de uso:**
```tsx
import { usePermission } from '../store/auth.hooks';

const Componente = () => {
  const canEdit = usePermission('productos:editar');

  return (
    <div>
      {canEdit && <button>Editar Producto</button>}
    </div>
  );
};
```

### 2. `useAnyPermission`
Verifica si el usuario tiene **al menos uno** de los permisos indicados (lógica OR).

**Firma:**
```typescript
const hasAccess = useAnyPermission(permisos: string[]): boolean;
```

**Ejemplo de uso:**
```tsx
const canManage = useAnyPermission(['inventario:ajustar_stock', 'inventario:gestionar_ubicaciones']);
```

---

## ⚙️ Funcionamiento Interno

1. **Contexto de Autenticación**: Los hooks utilizan `useAuth()` para obtener el objeto `user` actual del `AuthContext`.
2. **Memorización**: Utilizan `useMemo` para evitar re-cálculos innecesarios a menos que el usuario o el permiso cambien.
3. **Utilidades Base**: Delegan la lógica real a `hasPermission` y `hasAnyPermission` en `src/utils/auth/permissionUtils.ts`.
4. **Resiliencia**: Si el usuario no está autenticado o el permiso es `undefined`, el hook devuelve `false` (o `true` si el permiso es `undefined/null` dependiendo de la configuración, usualmente `false` para seguridad).

---

## 🚀 Mejores Prácticas

1. **No usar `hasPermission` directamente**: En componentes funcionales, siempre prefiere los hooks para asegurar que la UI se actualice si los permisos cambian (por ejemplo, tras un refresco de token).
2. **Granularidad**: Usa permisos específicos en lugar de roles (ej. `productos:crear` en lugar de `PROFESOR`).
3. **Guardias de Ruta**: Puedes usarlos en combinación con `useEffect` y `useNavigate` para proteger rutas completas:

```tsx
const canAccess = usePermission('admin:acceso');
const navigate = useNavigate();

useEffect(() => {
  if (canAccess === false) {
    navigate('/');
  }
}, [canAccess, navigate]);
```

---

## 🔗 Relacionado
- [Sistema RBAC (Backend)](../security/rbac.md)
- [Gestión de Usuarios](./gestion-usuarios.md)
