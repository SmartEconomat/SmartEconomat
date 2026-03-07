# Gestión de Usuarios (Módulo / Página)

Página maestra (`Usuarios.tsx`) que ensambla múltiples atómicos, componentes moleculares y de layout para entregar la interfaz de administración del Control de Acceso basado en Roles (RBAC) de SmartEconomat.

## Ubicación
`src/pages/Usuarios/Usuarios.tsx`
*(Y su subcomponente `UserModal.tsx` en el mismo directorio)*.

## Composición

1. **Barra Unificada (`PageToolbar`)**: Gestiona el título ("Gestión de Usuarios"), la búsqueda global por Nombre o Correo y los parámetros de paginación.
2. **Tabla Inteligente (`DataTable`)**: Instancia la grilla dinámica, mapeando el modelo de datos.
3. **Sistema de Feedback (`ToastContext`)**: Dispara alertas de éxito en operaciones CRUD (Verde) y excepciones al intentar cruzar validaciones de red o negocio (Rojo).
4. **Indicadores Semánticos**: Usa `StatusChip` para el estado (Activo/Inactivo) y `RoleBadge` para la entidad de poder (Admin/Profesor/Alumno).

## Reglas de Negocio Embebidas (Security Front-End)
Para evitar bloqueos catastróficos en el backend o en el uso diario:
- El modal bloquea la iteración del estado a **"Inactivo"** si se está editando al **Último Administrador** del sistema.
- Se previene la degradación en su Rol a uno inferior (Profesor, Alumno) bajo las mismas circunstancias.
- El disparador `handleDeleteConfirm` comprueba el catálogo local e impide purgar un administrador si se dejaría el sistema acéfalo de administradores activos.

## Funciones Modulares

- **Búsqueda Dinámica y Filtros Combinados**: El buscador textual abarca Nombre o Correo y reinicia automáticamente la paginación a `1` usando el EventLoop en los hooks.
- **Sincronización `useEffect`**: El módulo se autoinstancia con polling reactivo (`fetchUsuarios`), recargando el subset de la base de datos tras las mutaciones positivas del modal de edición o borrado cruzando los callbacks asíncronos en estado final `finally()`.
