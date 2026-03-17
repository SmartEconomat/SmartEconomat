# Requerimiento: Implementar Servicio de Correo Electrónico Real

## Módulo Afectado

`backend/smart-economat-backend/src/modules/auth/mail.service.ts`

## Descripción del Problema

El servicio de correo electrónico (`MailService`) actualmente **solo simula** el envío de emails mostrando los datos en los logs del servidor. **No envía correos reales** a los usuarios.

Esto afecta directamente al flujo de **recuperación de contraseña**:

1. El usuario solicita recuperar su contraseña ingresando su email en el formulario de login.
2. El backend genera un token de reset y llama a `mailService.sendPasswordResetEmail(email, token)`.
3. En lugar de enviar un email, el servicio solo imprime el enlace de recuperación en los logs del servidor.
4. El usuario **nunca recibe el correo** con el enlace para restablecer su contraseña.

## Código Actual (Simulación)

```typescript
// src/modules/auth/mail.service.ts
async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const recoveryLink = `${frontendUrl}/reset-password/${resetToken}`;

  this.logger.log(`To: ${email}`);
  this.logger.log(`Body: ...${recoveryLink}`);
  // ← Solo imprime en consola. No envía ningún email real.
}
```

## Solución Requerida

Implementar un proveedor de email real. Se recomienda usar **Nodemailer** con SMTP o un servicio como **SendGrid**, **Mailgun**, o **Resend**.

### Opción A: Nodemailer con SMTP (recomendado para desarrollo/producción propia)

**1. Instalar dependencia:**
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

**2. Variables de entorno necesarias (añadir a `.env`):**
```env
FRONTEND_URL=http://localhost:5173

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=tu-email@gmail.com
MAIL_PASS=tu-app-password
MAIL_FROM="SmartEconomat <no-reply@smarteconomat.com>"
```

**3. Implementación sugerida:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT ?? 587),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const recoveryLink = `${frontendUrl}/reset-password/${resetToken}`;

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM ?? '"SmartEconomat" <no-reply@smarteconomat.com>',
      to: email,
      subject: 'Restablecimiento de Contraseña - SmartEconomat',
      html: `
        <h2>Solicitud de restablecimiento de contraseña</h2>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para continuar (válido por 15 minutos):</p>
        <a href="${recoveryLink}">${recoveryLink}</a>
        <p>Si no solicitaste este cambio, ignora este correo.</p>
      `,
    });
  }
}
```

### Opción B: Servicio externo (recomendado para producción)

Usar un proveedor como [Resend](https://resend.com), [SendGrid](https://sendgrid.com) o [Mailgun](https://mailgun.com) ofrece mayor fiabilidad, logs de entrega y evita problemas de spam.

## Impacto en el Frontend

El frontend ya está correctamente implementado:
- El formulario de "Olvidaste tu contraseña" llama a `POST /auth/forgot-password` con el email.
- La página `/reset-password/:token` lee el token de la URL (parámetro de ruta) y llama a `POST /auth/reset-password`.
- El enlace generado por el backend usa el formato correcto: `${FRONTEND_URL}/reset-password/${token}`.

**No se requieren cambios en el frontend** una vez que el backend envíe el email real.

## Prioridad

🔴 **Alta** — La recuperación de contraseña es una funcionalidad crítica de seguridad para usuarios con rol ADMINISTRADOR y PROFESOR. Sin email real, esta función no está operativa en producción.
