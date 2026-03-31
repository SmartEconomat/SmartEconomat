# Protección CSRF (Cross-Site Request Forgery)

SmartEconomat implementa una capa de protección contra ataques CSRF (Cross-Site Request Forgery) utilizando el patrón **Double Submit Cookie**.

## ¿Qué es CSRF?
CSRF es un ataque que engaña a un usuario autenticado para que ejecute acciones no deseadas en una aplicación web en la que ya está autenticado. Dado que las cookies de sesión se envían automáticamente con cada petición al dominio, un sitio malicioso podría intentar realizar acciones en nombre del usuario.

## Implementación: Patrón Double Submit Cookie
A diferencia del patrón de Sincronizador de Tokens (que requiere persistencia en el servidor), el patrón de Doble Envío de Cookie es apátrida (stateless) y altamente escalable. 

### Flujo de trabajo:
1.  **Generación**: El servidor genera un token pseudo-aleatorio fuerte y lo envía al cliente en una cookie llamada `XSRF-TOKEN`.
2.  **Accesibilidad**: Esta cookie **no** tiene el flag `httpOnly`, lo que permite que el código JavaScript del cliente (ej. Axios, Angular, React) la lea legalmente.
3.  **Envío**: Para cada petición que modifique el estado (`POST`, `PUT`, `DELETE`, `PATCH`), el cliente lee el valor de la cookie y lo envía de vuelta en una cabecera HTTP personalizada: `X-XSRF-TOKEN`.
4.  **Validación**: El servidor (`CsrfMiddleware`) compara el valor de la cookie recibida con el valor de la cabecera recibida. Si coinciden, se garantiza que la petición proviene de un origen legítimo (Same-Origin Policy), ya que un sitio atacante no puede leer la cookie de `XSRF-TOKEN` ni añadir la cabecera personalizada.

## Detalles del Middleware
Ubicación: `src/common/middleware/csrf.middleware.ts`

### Métodos Protegidos
El middleware aplica una política de exclusión para métodos seguros, validando solo aquellos que cambian el estado del servidor:
- **Seguros**: `GET`, `HEAD`, `OPTIONS` (No se requiere validación).
- **Protegidos**: `POST`, `PUT`, `DELETE`, `PATCH` (Se requiere coincidencia exacta entre cookie y cabecera).

### Configuración de la Cookie
- **Nombre**: `XSRF-TOKEN`
- **httpOnly**: `false` (Crítico: debe ser falsy para permitir lectura del cliente).
- **secure**: Se activa dinámicamente si `NODE_ENV === 'production'`.
- **sameSite**: `strict` (Protección máxima contra envíos entre sitios).

## Configuración del Frontend
El servicio de API del frontend debe estar configurado para adjuntar automáticamente la cabecera. Ejemplo con Axios:

```typescript
// En el cliente (api.service.ts)
const api = axios.create({
  baseURL: process.env.VITE_API_URL,
  withCredentials: true, // Importante para enviar cookies de sesión
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});
```

## Registro en NestJS
Para activar la protección global, el middleware debe registrarse en el `AppModule`:

```typescript
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';

@Module({
  // ... imports
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
```

---
> [!IMPORTANT]
> Si recibes un error `403 Forbidden` con el mensaje "CSRF Token Invalido o Faltante", asegúrate de que el frontend está leyendo la cookie `XSRF-TOKEN` y enviándola correctamente en la cabecera `X-XSRF-TOKEN`.
