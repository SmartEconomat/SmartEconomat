import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Documentación en español.
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as Record<string, unknown>;

    return data ? user?.[data] : user;
  }
);
