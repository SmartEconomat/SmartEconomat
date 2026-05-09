import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

/** Clase pública (SherlockJwtAuthGuard). Paquete: smart-economat-backend (Nest). */
@Injectable()
export class SherlockJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Construye la instancia configurada.
   * @undefined {Reflector} reflector - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Expone "canActivate" en smart-economat-backend (Nest).
   * @undefined {ExecutionContext} context - Entrada efectiva esperada por el contrato.
   * @undefined {boolean | Promise<boolean> | Observable<boolean>} Datos efectivos después de ejecutar la operación.
   */
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
