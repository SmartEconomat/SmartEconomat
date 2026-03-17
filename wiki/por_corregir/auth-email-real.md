# 🔴 REQ-001 — Servicio de Correo Real para Recuperación de Contraseña

**Módulo:** `backend/smart-economat-backend/src/modules/auth/mail.service.ts`  
**Prioridad:** 🔴 Alta  
**Estado:** ❌ No implementado  

---

## Descripción del Problema

El sistema de recuperación de contraseña **no envía correos electrónicos reales** a los usuarios. La implementación actual del `MailService` únicamente simula el envío escribiendo el contenido del correo en los logs del servidor:

```typescript
// backend/src/modules/auth/mail.service.ts — estado actual
async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const recoveryLink = `http://localhost:5173/reset-password/${resetToken}`;

  this.logger.log(`\n================= EMAIL SIMULATION =================`);
  this.logger.log(`To: ${email}`);
  this.logger.log(`Subject: Password Reset Request`);
  this.logger.log(`Body: ... Click here to reset your password: ${recoveryLink}`);
  this.logger.log(`====================================================\n`);

  return Promise.resolve();
}
```

### Flujo actual (roto en producción)

```
Usuario → "¿Olvidé mi contraseña?" → introduce email
  → Backend genera token (15 min) y guarda en DB
  → MailService escribe en consola en lugar de enviar email
  → Usuario NUNCA recibe el enlace de recuperación
  → No puede restablecer su contraseña
```

---

## Solución Requerida

Implementar un servicio de correo real utilizando **Nodemailer** (recomendado para NestJS) o un proveedor externo como **SendGrid**, **Resend** o **Mailgun**.

### Opción A — Nodemailer con SMTP (recomendado para desarrollo/producción)

#### 1. Instalar dependencias

```bash
cd backend/smart-economat-backend
npm install @nestjs-modules/mailer nodemailer
npm install -D @types/nodemailer
```

#### 2. Configurar variables de entorno

Añadir al `.env.dev` y `.env.prod`:

```env
# Configuración de correo (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=tu-correo@gmail.com
MAIL_PASS=tu-contraseña-de-aplicacion
MAIL_FROM="SmartEconomat <noreply@smarteconomat.com>"

# URL del frontend (para el enlace de recuperación)
FRONTEND_URL=http://localhost:5173
```

#### 3. Reemplazar MailService

```typescript
// backend/src/modules/auth/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<boolean>('MAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173'
    );
    const recoveryLink = `${frontendUrl}/reset-password/${resetToken}`;

    await this.transporter.sendMail({
      from: this.configService.get<string>(
        'MAIL_FROM',
        '"SmartEconomat" <noreply@smarteconomat.com>'
      ),
      to: email,
      subject: 'Restablecimiento de contraseña — SmartEconomat',
      html: `
        <h2>Restablecimiento de contraseña</h2>
        <p>Has solicitado restablecer tu contraseña en SmartEconomat.</p>
        <p>Haz clic en el enlace siguiente para crear una nueva contraseña. 
           El enlace es válido durante <strong>15 minutos</strong>:</p>
        <p>
          <a href="${recoveryLink}" style="
            background-color: #1976d2;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
          ">
            Restablecer contraseña
          </a>
        </p>
        <p>Si no has solicitado este cambio, ignora este correo.</p>
        <hr/>
        <small>Este enlace caducará a los 15 minutos de haber sido generado.</small>
      `,
      text: `Restablecimiento de contraseña\n\nEnlace: ${recoveryLink}\n\nEl enlace caduca en 15 minutos. Si no solicitaste este cambio, ignora este correo.`,
    });

    this.logger.log(`Correo de recuperación enviado a: ${email}`);
  }
}
```

#### 4. Inyectar ConfigService en AuthModule

Asegurarse de que `ConfigModule` está importado en `AuthModule`:

```typescript
// backend/src/modules/auth/auth.module.ts
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule, // asegúrate de que esté incluido
    // ...
  ],
  providers: [AuthService, MailService],
  // ...
})
export class AuthModule {}
```

---

### Opción B — Resend (proveedor moderno, recomendado para producción)

```bash
npm install resend
```

```typescript
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const recoveryLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await this.resend.emails.send({
      from: 'SmartEconomat <noreply@resend.dev>',
      to: email,
      subject: 'Restablecimiento de contraseña',
      html: `<a href="${recoveryLink}">Restablecer contraseña</a> (válido 15 min)`,
    });
  }
}
```

---

## Impacto en Frontend

El frontend ya está correctamente implementado:
- `LoginForm.tsx` — llama a `authService.forgotPassword(email)` ✅
- `ResetPassword.tsx` — lee el token como parámetro de ruta `/reset-password/:token` ✅
- `auth.service.ts` — `POST /auth/forgot-password` y `POST /auth/reset-password` ✅

Una vez implementado el envío real de correos, el flujo completo funcionará sin más cambios en el frontend.

---

## Variables de Entorno a Documentar

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `MAIL_HOST` | `smtp.gmail.com` | Servidor SMTP |
| `MAIL_PORT` | `587` | Puerto SMTP |
| `MAIL_SECURE` | `false` | Usar TLS (true para puerto 465) |
| `MAIL_USER` | `user@gmail.com` | Usuario SMTP |
| `MAIL_PASS` | `app-password` | Contraseña o App Password |
| `MAIL_FROM` | `"SmartEconomat <noreply@...>"` | Dirección de envío |
| `FRONTEND_URL` | `https://smarteconomat.com` | URL base del frontend |
| `RESEND_API_KEY` | `re_...` | API key de Resend (opción B) |

---

## Archivos Afectados

| Archivo | Cambio necesario |
|---------|-----------------|
| `backend/src/modules/auth/mail.service.ts` | Reemplazar simulación por envío real |
| `backend/src/modules/auth/auth.module.ts` | Añadir `ConfigModule` si no está |
| `.env.dev` / `.env.prod` | Añadir variables de configuración de correo |
| `.env.example` | Documentar las nuevas variables |
