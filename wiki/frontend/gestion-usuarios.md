# 👥 Gestión de Usuarios - Frontend

La administración de usuarios en SmartEconomat se ha consolidado en una única vista centralizada para mejorar la experiencia de usuario y la mantenibilidad del código.

## 🏗️ Arquitectura de la Vista

La funcionalidad está implementada en `src/pages/Usuarios/UsuariosView.tsx`. Esta vista reemplaza a las antiguas páginas `Usuarios.tsx` y `AdminPanel.tsx`.

### Consolidación
- **Tabs/Acordeones**: Los usuarios se agrupan por tipo (Administradores, Profesores, Alumnos) para una navegación más clara.
- **Paginación Independiente**: Cada grupo mantiene su propia paginación y estado de carga, permitiendo gestionar grandes volúmenes de datos por rol sin interferencias.
- **Buscador Universal**: Un único campo de búsqueda que filtra en tiempo real sobre todos los grupos con un sistema de *debounce* de 500ms.

---

## 🛠️ Funcionalidades Principales

### 1. Gestión de Roles y Permisos
A diferencia del sistema anterior basado en enums, ahora es posible:
- Asignar múltiples roles a un usuario.
- Ver y editar permisos individuales (checklists) desde el `UserModal`.
- Los permisos por defecto se marcan automáticamente al seleccionar un rol de plantilla.

### 2. Acciones Rápidas
Cada fila en las tablas de usuarios ofrece:
- **Editar**: Abre el modal de edición de perfil y permisos.
- **Cambiar Contraseña**: Genera una nueva contraseña temporal segura.
- **Activar/Desactivar**: Cambia el estado `activo` del usuario sin eliminarlo.
- **Borrado Lógico**: Elimina el usuario de la vista principal (recuperable mediante Soft Delete).

### 3. Seguridad Reactiva
La vista utiliza los hooks `usePermission` para habilitar o deshabilitar acciones:
- `usuarios:crear`: Habilita el botón de "Añadir Usuario".
- `usuarios:editar`: Habilita el botón de edición.
- `usuarios:eliminar`: Habilita el botón de borrado.

---

## 📂 Estructura de Archivos Relacionada

- `src/pages/Usuarios/UsuariosView.tsx`: Vista principal y lógica de datos.
- `src/pages/Usuarios/UserModal.tsx`: Formulario dinámico para creación/edición.
- `src/types/usuario.ts`: Definiciones de interfaces y tipos de datos.
- `src/services/usuarioService.ts`: Comunicación con los endpoints `/usuarios` y `/admin`.

---

## 🔗 Relacionado
- [Hooks de Permisos](./hooks-permisos.md)
- [Sistema RBAC (Backend)](../security/rbac.md)
- [Soft Delete Global](../architecture/soft-delete.md)
