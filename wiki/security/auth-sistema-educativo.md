# 🎓 Autenticación y Sistema Educativo

Este documento detalla la lógica de vinculación profesor-alumno y los procesos de registro adaptados al entorno educativo de SmartEconomat.

## 📝 Registro de Usuarios

El sistema ofrece un formulario de registro dual (`RegisterForm.tsx`) donde el usuario elige su rol antes de completar los datos.

### 1. Registro de Alumnos
Los alumnos se registran de forma autónoma pero vinculada.
- **Identificación**: Username y Password únicos. No se requiere email obligatoriamente para agilizar el registro en el aula.
- **Vinculación por Código**: Deben introducir un **Código de Clase** (Slot) generado previamente por un profesor.
- **Validación en Tiempo Real**: El sistema valida el código antes del envío, confirmando al alumno en qué aula y con qué profesor se está registrando.
- **Estado Inicial**: `INACTIVE`. El alumno no puede iniciar sesión hasta que su profesor lo active desde el panel de gestión.

### 2. Registro de Profesores
- **Identificación**: Username, Email, Password y **CIAL** (identificador oficial).
- **Validación Institucional**: Las cuentas de profesor son creadas como `INACTIVE` y requieren que un **Administrador** verifique su CIAL y active la cuenta.
- **Capacidad**: Una vez activo, el profesor puede generar sus propios "Slots" para permitir el registro de sus alumnos.

---

## 🕒 Ciclo de Vida y Activación

Para mantener el orden y la seguridad, el sistema sigue este flujo de estados:

1.  **Registro**: El usuario crea la cuenta (Estado: `INACTIVE`).
2.  **Validación**:
    - **Alumnos**: El Profesor asignado los activa desde la pestaña "Alumnos" (Gestión por Acordeones).
    - **Profesores**: Un Administrador los activa desde la vista de "Usuarios".
3.  **Acceso**: Solo tras la activación el usuario puede realizar el **Login**.

---

## 🔑 Gestión de Credenciales Educativas

- **Reset de Alumnos**: Los profesores tienen la potestad de resetear la contraseña de sus propios alumnos en un solo click, generando una clave temporal para solucionar olvidos recurrentes en el aula.
- **Cambio Forzado**: Al resetear una clave, se puede marcar como cambio obligatorio en el siguiente inicio de sesión para asegurar que el alumno mantenga su privacidad.

---

## 🔗 Relacionado
- [Login y Registro (Seguridad)](./login-registro.md)
- [Gestión de Usuarios (UI)](../frontend/gestion-usuarios.md)
- [Permisos por Rol](../roles_y_permisos.md)
