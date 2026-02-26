# Role Badge

Componente visual miniatura (Chip) diseñado sobre Material UI (`@mui/material/Chip`) para identificar de un vistazo el rol de un usuario dentro de la base de datos de SmartEconomat. Sigue el ecosistema y la filosofía visual de `StatusChip`, manteniendo bordes oscuros, fuentes con peso y colores pasteles de fondo.

## Ubicación
`src/components/ui/RoleBadge.tsx`

## Variantes de Diseño

El color del Badge cambia dinámicamente según el Rol asignado:
- **Administrador**: Fondo azul pálido (`#e3f2fd`), texto azul fuerte (`#1565c0`). Denota un rol de alta jerarquía.
- **Profesor**: Fondo púrpura pálido (`#f3e5f5`), texto púrpura fuerte (`#6a1b9a`). Denota un rol de gestión académica.
- **Alumno**: Fondo naranja pálido (`#fff3e0`), texto naranja fuerte (`#e65100`). Denota un rol estándar/básico en la aplicación.

## Props

- `rol`: `string`. Debe ser `"Administrador"`, `"Profesor"` o `"Alumno"`.

## Dependencias
No posee dependencias lógicas complejas. Es puramente presentacional. 

## Uso

```tsx
import RoleBadge from '../../components/ui/RoleBadge';

// Dentro de un componente:
<RoleBadge rol="Administrador" />
<RoleBadge rol={usuario.rol} />
```
