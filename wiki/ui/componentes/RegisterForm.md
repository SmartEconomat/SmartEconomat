# Documentación de Componente: RegisterForm

**Tipo:** Componente de formulario (Feature)  
**Ubicación:** `src/features/auth/components/RegisterForm.tsx`  
**Última actualización:** 2026-02-28

---

## Descripción General

`RegisterForm` es el formulario de alta de nuevos usuarios. Recopila nombre, username, email y contraseña.

> ⚠️ **Importante:** Al igual que `LoginForm`, este componente **no gestiona la navegación ni el feedback post-registro**. Cuando el registro es exitoso, invoca `onRegisterSuccess()` y delega al padre (`Login.tsx`) toda la lógica de animación y mensaje de confirmación.

---

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `onToggleForm` | `() => void` | ✅ | Vuelve al formulario de inicio de sesión (toggle). |
| `onRegisterSuccess` | `() => void` | ✅ | Invocado cuando el servidor confirma el registro. El padre controla el overlay de éxito y la vuelta a login. |

---

## Estado Interno

| Estado | Tipo | Descripción |
|--------|------|-------------|
| `formData` | `{ nombre: string; username: string; email: string; password: string }` | Datos del nuevo usuario. |
| `isLoading` | `boolean` | Spinner del botón durante la petición. |
| `showPassword` | `boolean` | Alterna la visibilidad del campo contraseña. |
| `errorMsg` | `string` | Error de validación o de red mostrado en `Alert`. |

---

## Flujo de Registro

```
handleSubmit()
    ↓
POST /api/v1/auth/register  { nombre, username, email, password }
    ↓ (ok)
onRegisterSuccess()
    ↓
Login.tsx:
  phase = 'register-exit'  →  layout sale a la derecha
  Overlay "¡Registro exitoso!" visible (2500 ms)
  phase = 'register-return' →  layout login entra desde la izquierda
  phase = 'idle'
```

---

## Funcionalidades UX

### Toggle de visibilidad de contraseña

Campo contraseña con `InputAdornment` → `IconButton`:
- `Visibility` / `VisibilityOff` al pulsar.

### Feedback de error

Si el servidor responde con error, se muestra `<Alert severity="error">` con el mensaje:
- Si `message` es un array (errores de validación), se unen con `", "`.
- Si es string, se muestra directamente.
- Fallback: `"Error en el registro"`.

---

## API Consumida

| Método | Endpoint | Body |
|--------|----------|------|
| `POST` | `/api/v1/auth/register` | `{ nombre, username, email, password }` |

**Respuesta de éxito:** `HTTP 201` (cualquier 2xx).  
**Respuesta de error esperada:**
```json
{
  "message": "El email ya está registrado"
}
```

---

## Dependencias de Componentes UI

| Componente | Origen | Uso |
|-----------|--------|-----|
| `Input` | `components/ui/Input.tsx` | Todos los campos de texto |
| `Button` | `components/ui/Button.tsx` | Botón con estado de carga |

---

## Nota sobre el estado del usuario registrado

Los usuarios creados mediante registro quedan en estado **pendiente de confirmación** hasta que un administrador los active. Este estado es visible en el overlay de éxito que muestra `Login.tsx` tras el registro.
