# REQ-01: Servicio de Envío de Correos No Implementado

## Descripción

El sistema de recuperación de contraseña por correo electrónico **no funciona en producción** porque el `MailService` del backend únicamente simula el envío de emails mostrando el contenido en los logs del servidor, pero **no envía ningún correo real** al usuario.

## Archivo Afectado

```
backend/smart-economat-backend/src/modules/auth/mail.service.ts
```

## Comportamiento Actual

```typescript
// mail.service.ts — comportamiento actual (SOLO LOGS, no envía correos)
async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const recoveryLink = `http://localhost:5173/reset-password/${resetToken}`;

  this.logger.log(`To: ${email}`);
  this.logger.log(`Body: Click here to reset your password: ${recoveryLink}`);

  return Promise.resolve(); // ← No se envía ningún correo
}
```

## Flujo Afectado

El flujo completo de recuperación de contraseña depende de este servicio:

1. Usuario solicita recuperación en el formulario de login → `POST /auth/forgot-password`
2. Backend genera token y llama a `mailService.sendPasswordResetEmail()`
3. ❌ **El correo nunca llega al usuario** — el flujo queda interrumpido aquí
4. Usuario no puede acceder al enlace `/reset-password/:token`
5. Usuario no puede restablecer su contraseña

## Requerimiento

Implementar el envío real de correos electrónicos en el `MailService`. Se recomienda usar una de las siguientes opciones:

### Opción A: Nodemailer (recomendado para desarrollo/self-hosted)

```bash
npm install @nestjs-modules/mailer nodemailer
npm install -D @types/nodemailer
```

```typescript
// Ejemplo de integración con NestJS Mailer + Nodemailer
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: config.get<number>('MAIL_PORT'),
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: config.get('MAIL_FROM'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
```

### Opción B: SendGrid (recomendado para producción)

```bash
npm install @sendgrid/mail
```

```typescript
import * as sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
await sgMail.send({
  to: email,
  from: 'noreply@smarteconomat.com',
  subject: 'Restablecer Contraseña',
  html: `<a href="${recoveryLink}">Restablecer Contraseña</a>`,
});
```

## Variables de Entorno Requeridas

Añadir al `.env.example` y configurar en producción:

```env
# Configuración de correo (Nodemailer)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=noreply@smarteconomat.com
MAIL_PASS=your_email_password
MAIL_FROM="SmartEconomat <noreply@smarteconomat.com>"

# O para SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxx
```

## Prioridad

🔴 **Alta** — Sin esta funcionalidad, el flujo de recuperación de contraseña por correo electrónico es completamente inoperativo para los usuarios finales (profesores y administradores).

## Notas Adicionales

- Los **alumnos** no pueden usar este flujo porque no tienen email asociado en el sistema. Deben solicitar el restablecimiento directamente a su profesor mediante el endpoint `POST /profesores/alumnos/:id/force-reset`. Esta restricción ya está implementada y documentada en el frontend.
- El endpoint del backend (`POST /auth/forgot-password`) y los tokens de reset **ya funcionan correctamente**. Solo falta el envío del correo.
