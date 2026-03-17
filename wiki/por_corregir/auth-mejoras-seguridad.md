# 🟡 REQ-002 — Mejoras de Seguridad y UX en la Autenticación

**Módulos:** `auth`, `alumno`, `profesor`  
**Prioridad:** 🟡 Media  
**Estado:** ⚠️ Parcialmente implementado  

---

## 1. Email no incluido en el JWT — Impacto en el Frontend

**Archivo backend:** `backend/src/modules/auth/service/auth.service.ts`

### Descripción

El payload del JWT generado tras el login **no incluye el campo `email`**:

```typescript
// generateToken() — estado actual
const payload: JwtPayload = {
  sub: usuario.id,
  username: usuario.username,
  role: usuario.rol,
  // ⚠️ falta: email
};
```

### Impacto en Frontend

El `LoginForm.tsx` intenta leer el email del JWT decodificado:

```typescript
const user = {
  id: dec?.sub || '',
  name: dec?.username || formData.email,
  email: dec?.email || (formData.email.includes('@') ? formData.email : ''),
  // ↑ dec?.email siempre será undefined
};
```

El frontend maneja esto correctamente como fallback: si el usuario ingresó un email (`@`), lo usa directamente. Sin embargo, si el usuario inicia sesión con su **nombre de usuario** (no email), el campo `email` del objeto `User` quedará vacío.

### Solución Requerida

Añadir `email` al payload del JWT (si existe en el usuario):

```typescript
// backend/src/modules/auth/service/auth.service.ts
private generateToken(usuario: Usuario) {
  const payload: JwtPayload = {
    sub: usuario.id,
    username: usuario.username,
    role: usuario.rol,
    email: usuario.email ?? undefined,  // ← añadir
  };
  return { access_token: this.jwtService.sign(payload) };
}
```

Y actualizar la interfaz en el backend:

```typescript
// backend/src/modules/auth/interfaces/jwt-payload.interface.ts
export interface JwtPayload {
  sub: string;
  username: string;
  role: rolUsuario;
  email?: string;  // ← añadir
}
```

Y en el frontend:

```typescript
// frontend/src/features/auth/components/LoginForm.tsx
interface JwtPayload {
  sub?: string;
  username?: string;
  email?: string;  // ← ya existe, funcionará automáticamente
  role?: string;
}
```

---

## 2. Endpoint `POST /auth/register` — Sin Uso Explícito en Frontend

**Archivo backend:** `backend/src/modules/auth/controller/auth.controller.ts`

### Descripción

Existe un endpoint genérico `POST /api/v1/auth/register` que registra usuarios con rol `ALUMNO` y estado `INACTIVE`. Sin embargo, el frontend **no utiliza este endpoint**; en su lugar usa:

- `POST /api/v1/alumnos/register` — para registrar alumnos
- `POST /api/v1/profesores/register` — para registrar profesores

El endpoint `/auth/register` parece ser un remanente de desarrollo inicial.

### Acción Recomendada

- **Opción A:** Eliminar `POST /auth/register` del `AuthController` si no se usa.
- **Opción B:** Documentar su uso como endpoint de registro genérico de administradores.
- **Opción C:** Añadir guard `@Roles(ADMINISTRADOR, SUPER_ADMIN)` si debe mantenerse para uso administrativo.

---

## 3. Límite de Intentos de Login (Rate Limiting) — No Implementado

**Prioridad:** 🔴 Alta (seguridad)

### Descripción

No existe protección contra ataques de fuerza bruta en el endpoint `POST /auth/login`. Un atacante puede intentar múltiples combinaciones de credenciales sin restricción.

### Solución Requerida

Implementar rate limiting con `@nestjs/throttler`:

```bash
npm install @nestjs/throttler
```

```typescript
// Configuración en AppModule o AuthModule
ThrottlerModule.forRoot([{
  name: 'login',
  ttl: 60000,   // ventana de 60 segundos
  limit: 10,    // máximo 10 intentos por IP
}])
```

```typescript
// En AuthController
@UseGuards(ThrottlerGuard)
@Post('login')
async login(@Body() dto: LoginUserDto) { ... }
```

---

## 4. Token de Recuperación sin Invalidación al Cambiar Contraseña

**Archivo backend:** `backend/src/modules/auth/service/auth.service.ts`

### Descripción

Al usar `changePassword()` (cambio autenticado), no se invalida el token de recuperación pendiente si existe uno. Esto significa que si un admin resetea la contraseña y el usuario también hace `changePassword`, el token de recuperación antiguo podría seguir siendo válido hasta que expire (15 min).

### Solución Requerida

En `changePassword()`, limpiar el token de recuperación:

```typescript
async changePassword(userId, currentPassword, newPassword) {
  // ... validaciones existentes ...
  usuario.password = newPassword;
  usuario.mustChangePassword = false;
  usuario.passwordResetToken = null;       // ← añadir
  usuario.passwordResetExpires = null;     // ← añadir
  await this.usuarioRepo.save(usuario);
}
```

---

## 5. Confirmación de Registro de Profesor sin Feedback en UI

### Descripción

Cuando un profesor se registra, su cuenta queda en estado `INACTIVE` a la espera de activación por un administrador. El frontend redirige al formulario de login tras el registro exitoso, pero **no informa claramente** al usuario sobre este estado de espera.

### Solución Requerida

En `RegisterForm.tsx`, cuando `onRegisterSuccess()` es llamado para un profesor, mostrar un mensaje de confirmación específico antes de redirigir:

```tsx
// Estado adicional en RegisterForm
const [successMsg, setSuccessMsg] = useState('');

// En handleSubmit, tras res.success:
if (role === 'PROFESOR') {
  setSuccessMsg(
    'Tu cuenta ha sido creada y está pendiente de activación. ' +
    'Un administrador revisará tu solicitud pronto.'
  );
  // No llamar onRegisterSuccess() inmediatamente, esperar confirmación del usuario
} else {
  onRegisterSuccess();
}
```

---

## 6. Endpoint de Verificación de Token de Recuperación — No Implementado

### Descripción

No existe un endpoint `GET /auth/verify-reset-token/:token` que permita al frontend **verificar si un token de recuperación es válido** antes de mostrar el formulario de nueva contraseña.

### Impacto

El usuario que accede a `/reset-password/:token` con un token inválido o expirado no lo sabe hasta que intenta enviar el formulario. Esto genera una UX confusa.

### Solución Requerida

#### Backend — nuevo endpoint

```typescript
// auth.controller.ts
@Get('verify-reset-token/:token')
@HttpCode(HttpStatus.OK)
async verifyResetToken(@Param('token') token: string) {
  const isValid = await this.authService.verifyResetToken(token);
  return { valid: isValid };
}
```

```typescript
// auth.service.ts
async verifyResetToken(token: string): Promise<boolean> {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const usuario = await this.usuarioRepo.findOne({
    where: { passwordResetToken: hashedToken },
    select: ['id', 'passwordResetExpires'],
  });
  return !!(usuario?.passwordResetExpires && usuario.passwordResetExpires > new Date());
}
```

#### Frontend — `ResetPassword.tsx`

```tsx
// Al montar el componente, verificar el token
useEffect(() => {
  if (!token) {
    setErrorMsg('Enlace de recuperación inválido.');
    return;
  }
  authService.verifyResetToken(token).then((res) => {
    if (!res.data?.valid) {
      setErrorMsg('Este enlace ha expirado o es inválido. Solicita uno nuevo.');
    }
  });
}, [token]);
```

#### Servicio frontend

```typescript
// auth.service.ts — añadir método
async verifyResetToken(token: string): Promise<ApiResponse<{ valid: boolean }>> {
  const response = await baseFetch(`/auth/verify-reset-token/${encodeURIComponent(token)}`);
  return await parseApiResponse(response, 'No se pudo verificar el enlace.');
}
```

---

## Resumen de Cambios Requeridos

| # | Descripción | Prioridad | Módulo |
|---|-------------|-----------|--------|
| 1 | Añadir `email` al JWT payload | 🟡 Media | Backend: `auth.service.ts` |
| 2 | Revisar endpoint `/auth/register` sin uso | 🟢 Baja | Backend: `auth.controller.ts` |
| 3 | Rate limiting en `/auth/login` | 🔴 Alta | Backend: `auth.controller.ts` |
| 4 | Invalidar token de recuperación en `changePassword` | 🟡 Media | Backend: `auth.service.ts` |
| 5 | Mensaje de espera de activación para profesores | 🟡 Media | Frontend: `RegisterForm.tsx` |
| 6 | Endpoint `GET /auth/verify-reset-token/:token` | 🟡 Media | Backend + Frontend |
