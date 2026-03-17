# REQ-02: URL del Frontend Hardcodeada en el Backend

## Descripción

La URL base del frontend está **hardcodeada** como `http://localhost:5173` en el `MailService` del backend. Esto hace que en entornos de staging o producción, el enlace de restablecimiento de contraseña incluido en el correo apunte a `localhost` y sea inutilizable para el usuario final.

> **Nota:** Este bug de URL también fue corregido en la misma actualización — el formato de URL pasó de `?token=` (query param) a `/:token` (path param) para coincidir con la ruta del frontend `/reset-password/:token`.

## Archivo Afectado

```
backend/smart-economat-backend/src/modules/auth/mail.service.ts
```

## Comportamiento Actual

```typescript
// URL hardcodeada — solo funciona en desarrollo local
const recoveryLink = `http://localhost:5173/reset-password/${resetToken}`;
```

## Requerimiento

Leer la URL base del frontend desde una variable de entorno para que funcione en todos los entornos.

### Implementación Sugerida

```typescript
// mail.service.ts — usando ConfigService de NestJS
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const recoveryLink = `${frontendUrl}/reset-password/${resetToken}`;
    // ... envío del correo
  }
}
```

## Variable de Entorno Requerida

Añadir al `.env.example`:

```env
# URL pública del frontend (usada en emails)
FRONTEND_URL=http://localhost:5173
```

En producción, configurar con la URL real, por ejemplo:

```env
FRONTEND_URL=https://app.smarteconomat.com
```

## Prioridad

🟡 **Media** — Este problema solo afecta a entornos de staging/producción. En desarrollo local con el frontend en `localhost:5173`, el enlace funciona correctamente. Se debe corregir antes del despliegue en producción.

## Entornos Afectados

| Entorno | Estado |
|---------|--------|
| Desarrollo local (puerto 5173) | ✅ Funciona |
| Staging / producción | ❌ El enlace apunta a localhost |
