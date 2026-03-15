# Documentación de Componente: RegisterForm

**Tipo:** Componente de formulario (Feature)  
**Ubicación:** `src/features/auth/components/RegisterForm.tsx`  
**Última actualización:** 2026-02-28

---

## Descripción General

`RegisterForm` es el formulario de alta de nuevos usuarios. Recopila datos personales y, fundamentalmente, la vinculación con el sistema educativo para alumnos.

---

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `onToggleForm` | `() => void` | ✅ | Vuelve al formulario de inicio de sesión. |
| `onRegisterSuccess` | `() => void` | ✅ | Invocado al confirmar el registro. |

---

## Estado Interno (Campos Extendidos)

| Estado | Tipo | Descripción |
|--------|------|-------------|
| `role` | `string` | 'ALUMNO' o 'PROFESOR'. Determina los campos visibles. |
| `cial` | `string` | Identificador único del alumno (se normaliza a Mayúsculas). |
| `aulaId` | `string` | Selección superior del Curso/Grupo. |
| `slotId` | `string` | Selección de Clase específica vinculada al Aula. |
| `profesorId` | `string` | Profesor asignado automáticamente al seleccionar el Slot. |

## Integración con Sistema Educativo (Selects Dependientes)

Para los alumnos, el registro implementa una jerarquía de selección para garantizar la integridad de los datos:
1. **Selección de Aula**: Se cargan los cursos disponibles (ej: 1º ESO A).
2. **Selección de Clase (Slot)**: Al elegir aula, se habilitan los números de clase disponibles para ese curso.
3. **Identificación de Profesor**: El sistema detecta y muestra el profesor responsable de ese slot antes de confirmar.

---

## API Consumida

| Método | Endpoint | Body (Alumno) |
|--------|----------|------|
| `POST` | `/api/v1/auth/register` | `{ nombre, username, email, password, role, cial, slotId }` |

**Normalización de Datos**:
- El campo `CIAL` se convierte siempre a `toUpperCase()` antes del envío.
- Se aplica `.trim()` a todos los campos de texto para evitar errores de duplicidad por espacios.

---

## Registro de Profesores
Para el rol `PROFESOR`, no se solicitan campos de aula. El profesor se registra y, una vez logueado, configura sus clases desde su **Perfil de Usuario**.
