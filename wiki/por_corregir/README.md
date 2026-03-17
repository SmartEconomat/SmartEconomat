# Requerimientos Pendientes y Correcciones Necesarias

Este directorio documenta funcionalidades del backend que aún no están implementadas
o que presentan errores que afectan al correcto funcionamiento del frontend.

---

## 1. Servicio de Envío de Correo Real (Crítico)

**Archivo:** `backend/smart-economat-backend/src/modules/auth/mail.service.ts`

**Estado actual:** El servicio `MailService.sendPasswordResetEmail` únicamente **simula** el envío
del correo mostrando el contenido por consola (`Logger.log`). No realiza ningún envío real.

**Impacto:** La recuperación de contraseña **no funciona en ningún entorno** fuera de desarrollo
local donde se tenga acceso a los logs del servidor. Un usuario real nunca recibirá el correo
con el enlace de restablecimiento.

**Requerimiento:** Implementar un servicio de correo electrónico real. Opciones sugeridas:

- **SMTP estándar** mediante `nodemailer` (libre, configurable con cualquier proveedor).
- **SendGrid** mediante `@sendgrid/mail` (plan gratuito disponible).
- **AWS SES** si el despliegue es en AWS.
- **Resend** (`resend` npm package, plan gratuito con 3 000 emails/mes).

La implementación debe:
1. Leer credenciales desde variables de entorno (`.env`): `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`.
2. Construir el enlace usando la variable de entorno `FRONTEND_URL` en lugar del literal `http://localhost:5173`.
3. Manejar errores de envío sin exponer detalles internos al cliente.

**Ejemplo de variable de entorno necesaria:**
```
FRONTEND_URL=https://tu-dominio.com
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASS=SG.xxxxxxxxxxxx
MAIL_FROM=no-reply@tu-dominio.com
```

---

## 2. URL del Enlace de Restablecimiento (Corregido)

**Archivo:** `backend/smart-economat-backend/src/modules/auth/mail.service.ts`

**Problema original:** El enlace generado usaba un query-param (`?token=...`):
```
http://localhost:5173/reset-password?token=<token>
```
pero el router del frontend espera el token como segmento de ruta:
```
/reset-password/:token
```
Esto provocaba que el componente `ResetPassword.tsx` (que usa `useParams`) recibiera
`undefined` como token y el backend rechazara la petición.

**Estado:** ✅ Corregido en el mismo PR. El enlace ahora usa el formato de ruta correcto:
```
http://localhost:5173/reset-password/<token>
```
Cuando se implemente el envío de correo real (punto 1), deberá usarse la variable
`FRONTEND_URL` en lugar del literal `http://localhost:5173`.

---

## 3. Activación de Cuenta de Profesor (Pendiente de Revisión)

**Contexto:** El registro de alumnos (`POST /alumnos/register`) crea el usuario con estado
`INACTIVE`. El profesor debe activarlo manualmente mediante `PATCH /profesores/alumnos/:id/activate`.

**Estado actual del profesor:** El registro de profesores (`POST /profesores/register`) también
crea el usuario con estado `INACTIVE`. Sin embargo, **no existe ningún flujo visible en el
frontend ni en el panel de administración** para que un administrador active la cuenta de un
profesor recién registrado.

**Requerimiento:** Implementar en el panel de administración una sección que liste los profesores
con estado `INACTIVE` y permita activarlos / desactivarlos. Endpoints necesarios (a confirmar
con el backend):

| Verbo | Ruta sugerida | Descripción |
|-------|---------------|-------------|
| `GET` | `/profesores/pending` | Listar profesores pendientes de activación |
| `PATCH` | `/profesores/:id/activate` | Activar cuenta de profesor |
| `PATCH` | `/profesores/:id/deactivate` | Desactivar cuenta de profesor |

---

## 4. Verificación de Correo Electrónico al Registrarse (Mejora)

**Contexto:** Actualmente los profesores se registran con cualquier dirección de correo
sin que se verifique que les pertenece.

**Requerimiento:** Enviar un correo de verificación al email indicado durante el registro de
profesor. El usuario debe hacer clic en el enlace para que su cuenta quede en estado pendiente
de activación por el administrador (o directamente activa, según política del sistema).

Endpoints necesarios:

| Verbo | Ruta sugerida | Descripción |
|-------|---------------|-------------|
| `GET` | `/auth/verify-email/:token` | Verificar el correo tras el clic en el enlace |

---

## 5. Refresco de Token JWT (Mejora de Seguridad)

**Contexto:** El sistema emite tokens JWT sin expiración configurada explícitamente
(o con expiración larga). Si un token queda comprometido, permanece válido hasta que expire.

**Requerimiento:** Implementar un mecanismo de refresh token:

| Verbo | Ruta sugerida | Descripción |
|-------|---------------|-------------|
| `POST` | `/auth/refresh` | Emitir nuevo access token a partir de un refresh token válido |
| `POST` | `/auth/logout` | Invalidar el refresh token activo |

El frontend (`api.service.ts`) ya captura los errores `401` y emite el evento
`AUTH_EVENTS.UNAUTHORIZED`. Será necesario interceptar ese evento para intentar el
refresco antes de cerrar la sesión.
