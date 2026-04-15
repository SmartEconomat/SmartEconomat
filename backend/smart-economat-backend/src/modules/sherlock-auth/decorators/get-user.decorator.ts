import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator that extracts the authenticated user (or a specific field of it)
 * from the current HTTP request.
 *
 * Usage examples:
 * ```ts
 * // Inject the full user object
 * @GetUser() user: JwtPayload
 *
 * // Inject only the user's id
 * @GetUser('id') userId: string
 * ```
 *
 * @param {string | undefined} data - Optional key of the user object to return.
 *   When omitted the entire user object is returned.
 * @param {ExecutionContext} ctx - NestJS execution context used to access the request.
 * @returns {unknown} The full user object or the value of the requested field.
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as Record<string, unknown>;

    return data ? user?.[data] : user;
  }
);
