# Plan de Pruebas: Módulo de Administración (Utilities)

Este documento detalla los escenarios de prueba para las utilidades administrativas críticas, enfocadas en la inicialización del sistema, gestión de personal docente y recuperación de accesos.

---

## 1. Listado de Tests E2E (Integración Completa)

### A. Gestión de Profesores (POST /api/v1/admin/profesor)

1. **E2E-ADM-01-CRE-PROF**: Registro exitoso de un profesor. Verificar creación simultánea en las tablas `Usuario` (con rol PROFESOR y estado INACTIVE) y `Profesor`.
2. **E2E-ADM-02-CRE-ERR-UNI**: Error 409 (Conflict) al intentar crear un profesor con un `username` o `email` que ya existe en el sistema.
3. **E2E-ADM-03-CRE-ERR-CIAL**: Error 409 (Conflict) al intentar usar un código `CIAL` ya asignado a otro profesor.
4. **E2E-ADM-04-CRE-TRX**: Verificación de **Atomicidad**: Si falla la inserción en la tabla `Profesor`, el `Usuario` vinculado no debe quedar creado (Rollback).

### B. Mantenimiento de Cuentas (PATCH /api/v1/admin/usuarios)

5. **E2E-ADM-05-ACT**: Activar un usuario inactivo. Verificar cambio a estado `ACTIVE` y respuesta de éxito.
6. **E2E-ADM-06-ACT-ERR**: Error 400 al intentar activar un usuario que ya está `ACTIVE`.
7. **E2E-ADM-07-ACT-NF**: Error 404 al intentar activar un usuario inexistente.

### C. Recuperación y Seguridad (POST /api/v1/admin/password-reset)

8. **E2E-ADM-08-FRS**: Forzar reseteo de contraseña de un usuario. Verificar que se genera una contraseña provisional aleatoria y se marca el flag `mustChangePassword = true`.
9. **E2E-ADM-09-FRS-SEC**: Verificar que tras el reseteo forzado, los tokens previos de recuperación (`passwordResetToken`) quedan invalidados/nulos.
10. **E2E-ADM-10-FRS-NF**: Error 404 al intentar resetear un usuario inexistente.

### D. Seguridad y RBAC

11. **E2E-ADM-11-SEC-FORB**: Verificar que un usuario con rol `PROFESOR` o `ALUMNO` no puede acceder a ningún endpoint de este módulo (Error 403 Forbidden).
12. **E2E-ADM-12-SEC-ADMIN**: Confirmar que solo el rol `ADMINISTRADOR` tiene acceso total a estas utilidades.

---

## 2. Reglas de Negocio Críticas

- **Transaccionalidad Profesor**: La creación de un profesor es una "entidad compuesta". El sistema debe garantizar que ambas tablas se actualizan en una sola transacción para evitar huérfanos.
- **Estado Inicial**: Los nuevos profesores se crean siempre como `INACTIVE` por seguridad, requiriendo una activación manual posterior (o vía email de confirmación si se implementa).
- **Contraseñas Provisionales**: Deben ser suficientemente seguras (mínimo 8 caracteres, mezcla de tipos) y de un solo uso (obligando al usuario a cambiarla en su primer login).

---

## 3. Stress y Edge Cases

- **Colisión de CIAL**: Intentar registrar 10 profesores simultáneamente con el mismo CIAL para validar los bloqueos de base de datos.
- **Reseteo en Batch**: (Si aplica) Forzar reseteo masivo de toda una clase de alumnos.
- **Username con Caracteres Especiales**: Crear profesores con nombres de usuario complejos (puntos, guiones, etc.) según política de empresa.
