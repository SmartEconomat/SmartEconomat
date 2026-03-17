# Requerimientos Backend Pendientes

Este documento recoge las funcionalidades o correcciones necesarias en el backend que afectan al correcto funcionamiento del frontend.

---

## 1. Servicio de Envío de Correo Electrónico Real

### Descripción

El servicio de correo actual (`MailService`) es una **simulación** que únicamente imprime los mensajes en el log del servidor, sin enviarlos realmente.

**Archivo afectado:**
`backend/smart-economat-backend/src/modules/auth/mail.service.ts`

**Comportamiento actual:**
```typescript
async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  // Solo hace un logger.log() del enlace — no envía ningún correo real
  this.logger.log(`Recovery link: http://localhost:5173/reset-password?token=${resetToken}`);
  return Promise.resolve();
}
```

### Impacto

El flujo de **recuperación de contraseña** está completamente implementado en frontend y backend, pero **el usuario nunca recibe el correo** porque el servicio no envía nada.

### Requerimiento

Implementar el envío real de correo electrónico utilizando uno de los siguientes proveedores:

- **Nodemailer** (SMTP — recomendado para producción con servidor de correo propio)
- **SendGrid** / **Mailgun** / **Resend** (servicios externos con plan gratuito)
- **@nestjs-modules/mailer** (módulo oficial de NestJS con soporte para plantillas Handlebars/PUG)

#### Datos mínimos necesarios para el correo de recuperación:

| Campo | Valor |
|-------|-------|
| **Destinatario** | Email del usuario que solicita el restablecimiento |
| **Asunto** | "Restablecimiento de contraseña — SmartEconomat" |
| **Enlace de recuperación** | `{FRONTEND_URL}/reset-password?token={token}` |
| **Expiración** | El token expira en 15 minutos (ya implementado en el backend) |

#### Variables de entorno necesarias (`.env`):

```env
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=noreply@smarteconomat.com
MAIL_PASSWORD=tu_contraseña
MAIL_FROM="SmartEconomat <noreply@smarteconomat.com>"
FRONTEND_URL=https://smarteconomat.example.com
```

---

## 2. URL del Enlace de Recuperación en el Servicio de Correo

### Descripción

El `MailService` genera actualmente el enlace de recuperación con la URL hardcodeada de desarrollo:

```
http://localhost:5173/reset-password?token=${resetToken}
```

### Problemas identificados

1. **URL hardcodeada** a `localhost:5173`, lo que rompe el flujo en cualquier entorno que no sea desarrollo local.
2. El formato de la URL usa **query param** (`?token=`), que coincide con la ruta `/reset-password` del frontend (ya corregido en el frontend para soportar ambos formatos).

### Requerimiento

- Leer la URL base del frontend desde una variable de entorno (`FRONTEND_URL`).
- Asegurar que el formato del enlace sea: `{FRONTEND_URL}/reset-password?token={token}`

**Ejemplo corregido:**
```typescript
const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
const recoveryLink = `${frontendUrl}/reset-password?token=${resetToken}`;
```

---

## 3. Confirmación de Correo para Profesores en el Registro

### Descripción

Al registrar un profesor (`POST /profesores/register`), se requiere un **email válido**. Sin embargo, actualmente no existe ningún mecanismo de verificación de que ese correo le pertenezca realmente al profesor.

### Impacto

Un usuario podría registrarse usando el correo de otra persona y recibir los correos de recuperación de contraseña de esa cuenta.

### Requerimiento (opcional / mejora futura)

Implementar verificación de correo electrónico tras el registro de profesor:
1. Enviar un correo de confirmación con un enlace de activación.
2. Marcar la cuenta como `emailVerified = false` hasta que se confirme.
3. Bloquear el login hasta que el correo sea verificado (o permitirlo con funcionalidad limitada).

---

## Resumen de Prioridades

| # | Requerimiento | Prioridad | Impacto |
|---|---------------|-----------|---------|
| 1 | Implementar servicio de correo real | **Alta** | Sin esto la recuperación de contraseña nunca llega al usuario |
| 2 | URL del frontend configurable por variable de entorno | **Alta** | Necesario para despliegue en producción |
| 3 | Verificación de email al registrar profesor | Media | Mejora de seguridad |
