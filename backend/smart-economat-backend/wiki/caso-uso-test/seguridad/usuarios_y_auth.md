# Plan de Pruebas: Módulo de Seguridad y Usuarios

Este documento detalla los escenarios de prueba para la gestión de usuarios, procesos de autenticación (JWT) y el sistema de autorización basado en permisos granulares (RBAC).

---

## 1. Autenticación (POST /api/v1/auth)

### A. Login y Token

1. **E2E-SEC-01-LOG**: Login exitoso con credenciales válidas. Verificar que devuelve un `accessToken` y datos del usuario.
2. **E2E-SEC-02-LOG-ERR**: Error 401 por contraseña incorrecta.
3. **E2E-SEC-03-LOG-ERR**: Error 401 por usuario inexistente o bloqueado.
4. **E2E-SEC-04-LOG-ERR**: Error 400 por campos faltantes en el body.
5. **E2E-SEC-05-REF**: (Si aplica) Renovación de token mediante `refreshToken`.

---

## 2. Gestión de Usuarios (CRUD /api/v1/usuarios)

### B. Perfil y Cuenta

6. **E2E-SEC-06-PER**: Obtener el perfil del usuario autenticado (`/perfil`).
7. **E2E-SEC-07-PER-UPD**: Actualizar datos propios (nombre, email) y verificar persistencia.
8. **E2E-SEC-08-PAS-UPD**: Cambiar contraseña propia validando la contraseña actual.

### C. Administración (Operaciones de Admin)

9. **E2E-SEC-09-LST**: Listado paginado de usuarios con filtros por rol o estado.
10. **E2E-SEC-10-ACT**: Activar/Desactivar un usuario y verificar que no puede loguearse tras la desactivación.
11. **E2E-SEC-11-ROL**: Cambiar el rol de un usuario (ej: de Alumno a Profesor).
12. **E2E-SEC-12-RST**: Resetear la contraseña de un usuario por parte de un administrador.
13. **E2E-SEC-13-DEL**: Eliminar físicamente un usuario (validar restricciones de integridad si tiene registros vinculados).

---

## 3. Sistema de Autorización y Permisos (RBAC)

### D. Permisos Granulares

14. **E2E-SEC-14-PERM-ADD**: Asignar un permiso adicional específico a un usuario que no lo tiene por su rol.
15. **E2E-SEC-15-PERM-EXC**: Excluir un permiso específico a un usuario que sí lo tiene por su rol.
16. **E2E-SEC-16-GRD-OK**: Acceder a un recurso protegido con el permiso necesario.
17. **E2E-SEC-17-GRD-ERR**: Acceder a un recurso protegido sin el permiso necesario (Verificar error 403 Forbidden).

---

## 4. Auditoría y Seguridad

18. **E2E-SEC-18-AUD**: Verificar que el login fallido queda registrado (si hay log de seguridad).
19. **E2E-SEC-19-JWT-VAL**: Intentar acceder con un token JWT expirado o mal formado (Error 401).
20. **E2E-SEC-20-CONCUR**: (Opcional) Intentar login con la misma cuenta desde dos sitios (Manejo de sesiones múltiples).

---

## 5. Stress y Edge Cases

- **Búsqueda Masiva de Usuarios**: Rendimiento del listado con +1000 usuarios.
- **Permisos Complejos**: Comprobar la jerarquía de permisos cuando hay solapamientos entre rol, permisos adicionales y excluidos.
- **Passwords Débiles**: Validar que el sistema obliga a un mínimo de seguridad en la contraseña.
