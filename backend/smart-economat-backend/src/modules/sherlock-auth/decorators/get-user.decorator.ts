import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as Record<string, unknown>;

    return data ? user?.[data] : user;
  }
);
