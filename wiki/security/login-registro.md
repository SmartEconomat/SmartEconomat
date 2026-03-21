# 🔐 Login y Registro - Seguridad

Este documento detalla los flujos de autenticación y creación de cuentas en SmartEconomat, incluyendo las validaciones de acceso y la integración con el sistema educativo.

## 🚪 Inicio de Sesión (Login)

El acceso al sistema se gestiona a través de `LoginForm.tsx` y el `AuthService` del backend.

### Sesión actual (`cookie-first`)

- El backend responde al login estableciendo una cookie `httpOnly` `access_token`.
- El frontend no usa `localStorage` como fuente de verdad para la sesión autenticada.
- Tras el login, `AuthContext` mantiene el usuario en memoria y, en recargas, lo reconstruye consultando `GET /api/v1/usuarios/perfil`.
- El logout se realiza mediante `POST /api/v1/auth/logout`, que limpia la cookie en backend.

### 📋 Requisitos de Acceso
- **Identificación**: Se admite tanto el nombre de usuario como el correo electrónico.
- **Estado de Cuenta**: Solo los usuarios con `status: 'ACTIVE'` pueden entrar. Si una cuenta está `INACTIVE` (pendientes de validación) o `BLOCKED`, se denegará el acceso.
- **Cambio de Contraseña Forzado**: Si un administrador resetea la contraseña de un usuario, se activa la bandera `mustChangePassword`. El sistema obligará al usuario a definir una nueva contraseña segura antes de permitirle navegar por la aplicación.

### 🛠️ Funcionalidades Extra
- **Recordarme**: Almacena el identificador en `localStorage` para facilitar futuros accesos.
- **Recuperación de Contraseña**: 
    - **Profesores/Administradores**: Pueden solicitar un enlace de recuperación vía email.
    - **Alumnos**: Por seguridad y falta de email obligatorio, deben solicitar el reseteo directamente a su profesor asignado.

---

## 📝 Registro de Usuarios

El registro está dividido en dos perfiles con requisitos estrictamente diferenciados en `RegisterForm.tsx`.

### 1. Perfil Alumno
Diseñado para un registro rápido y vinculado automáticamente a un docente.
- **Código de Clase**: Es obligatorio. El formulario valida el código en tiempo real, mostrando al alumno el nombre del profesor y el aula para evitar errores de vinculación.
- **Estado Inicial**: Siempre se crea como `INACTIVE`. No podrá loguearse hasta que el profesor lo valide en su panel de gestión.
- **Rol**: Se asigna automáticamente el rol `ALUMNO`.

### 2. Perfil Profesor
- **Identificación CIAL**: Requiere un identificador único (DNI/NIE o código educativo).
- **Email**: Obligatorio para notificaciones y recuperación de cuenta.
- **Estado Inicial**: Se crea como `INACTIVE`. Debe ser validado por un `ADMINISTRADOR` o `SUPER_ADMIN`.

---

## 🛡️ Políticas de Seguridad Aplicadas

### Validación de Contraseñas
Se aplica una política de "Contraseña Fuerte" tanto en registro como en cambio de clave:
- Mínimo 8 caracteres.
- Al menos una mayúscula.
- Al menos un número.
- Al menos un carácter especial (ej. `!@#$%^&*`).

### Protección de Rutas
El sistema utiliza `PublicRoute` y `ProtectedRoute` en frontend, ambos basados en la verificación real de sesión con backend.

- Si la cookie es válida, el usuario accede a la aplicación sin reintroducir credenciales.
- Si backend responde `401`, la sesión se limpia y la app redirige a `/login`.
- Si el usuario autenticado no dispone del permiso exigido por la ruta, se redirige a `/`.

---

## 🔗 Relacionado
- [Sistema RBAC (Backend)](./rbac.md)
- [Gestión de Usuarios (Frontend)](../frontend/gestion-usuarios.md)
- [Auth Sistema Educativo](./auth-sistema-educativo.md)
