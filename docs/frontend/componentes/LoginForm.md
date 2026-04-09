# Documentación de Componente: LoginForm

**Tipo:** Componente de formulario (Feature)  
**Ubicación:** `src/features/auth/components/LoginForm.tsx`  
**Última actualización:** 2026-02-28

---

## Descripción General

`LoginForm` es el formulario de inicio de sesión. Gestiona la entrada de credenciales, la visibilidad de la contraseña, el estado de carga y los errores de red/autenticación.

> [!IMPORTANT]
> Este componente **no llama directamente** a `AuthContext.login()`. En su lugar, delega la autenticación al componente padre (`Login.tsx`) mediante el callback `onLoginSuccess`. Esto permite que el padre ejecute la animación de salida **antes** de navegar al dashboard.

---

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `onToggleForm` | `() => void` | Sí | Cambia al modo de registro. |
| `onLoginSuccess` | `(user: DecodedUser, token: string) => void` | Sí | Invocado cuando el login es exitoso. El padre gestiona la animación y la navegación. |

### Tipo `DecodedUser`

```typescript
interface DecodedUser {
    name: string;   // nombre del usuario (del JWT o del email si no hay nombre)
    email: string;  // email introducido en el formulario
}
```

---

## Estado Interno

| Estado | Tipo | Descripción |
|--------|------|-------------|
| `formData` | `{ email: string; password: string }` | Valores de los campos del formulario. |
| `isLoading` | `boolean` | Activa el spinner del botón durante la petición. |
| `showPassword` | `boolean` | Alterna la visibilidad del campo de contraseña. |
| `errorMsg` | `string` | Mensaje de error mostrado en un `Alert` si la autenticación falla. |

---

## Flujo de Autenticación

```
handleSubmit()
    ↓
POST /api/v1/auth/login  { email, password }
    ↓ (ok)
parseJwt(token)  →  extrae nombre del payload
    ↓
onLoginSuccess({ name, email }, token)
    ↓
Login.tsx ejecuta animación de salida → login() del AuthContext → navega
```

---

## Funcionalidades UX

### Toggle de visibilidad de contraseña

El campo contraseña incluye un `IconButton` al final (mediante `InputAdornment`):
- Ojo abierto (`Visibility`) → contraseña oculta
- Ojo tachado (`VisibilityOff`) → contraseña visible

### Feedback de carga

El botón "Acceder" recibe `isLoading={true}` durante la petición, mostrando un spinner interno (gestionado por el componente `Button.tsx`).

### Feedback de error

Si la respuesta del servidor no es `2xx`, se muestra un `<Alert severity="error">` con el mensaje:
- `"Credenciales inválidas, intenta de nuevo."` — error HTTP del servidor.
- `"Error de conexión al servidor."` — error de red (catch).

---

## API Consumida

| Método | Endpoint | Body |
|--------|----------|------|
| `POST` | `/api/v1/auth/login` | `{ email: string, password: string }` |

**Respuesta esperada:**
```json
{
  "data": {
    "access_token": "eyJ..."
  }
}
```

---

## Dependencias de Componentes UI

| Componente | Origen | Uso |
|-----------|--------|-----|
| `Input` | `components/ui/Input.tsx` | Campos de texto estilizados |
| `Button` | `components/ui/Button.tsx` | Botón con estado de carga |
| `Checkbox` | `components/ui/Checkbox.tsx` | "Recordarme" |

---

## Accesibilidad

- `<h1>` visualmente oculto con clase `visuallyHidden` para screen readers.
- `aria-label="revelar contraseña"` en el `IconButton` del campo contraseña.
- Soporte de envío con `Enter` gracias a `noValidate` + `onSubmit`.
