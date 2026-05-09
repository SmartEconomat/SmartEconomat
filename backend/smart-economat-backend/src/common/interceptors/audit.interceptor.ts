import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AUDIT_ACTION_KEY,
  AuditActionConfig,
} from '../decorators/audit-action.decorator';
import { AuditEvent } from '../events/audit.event';
import { TipoMovimiento } from '../../modules/movimiento/enums/movimiento.enums';

/** Petición Express/Nest suficientemente tipada para la auditoría. */
interface AuditHttpRequestLike {
  method: string;
  url: string;
  params?: { id?: string };
  body?: { newName?: unknown };
  user?: { id?: string };
}

function resolveEntityId(req: AuditHttpRequestLike, response: unknown): string {
  const fromParams = req.params?.id;
  if (typeof fromParams === 'string' && fromParams.length > 0) {
    return fromParams;
  }

  const asRecord = (obj: unknown): Record<string, unknown> | null =>
    typeof obj === 'object' && obj !== null
      ? (obj as Record<string, unknown>)
      : null;

  const resObj = asRecord(response);
  if (!resObj) {
    return '';
  }

  const outerId = resObj['id'];
  if (typeof outerId === 'string' && outerId.length > 0) {
    return outerId;
  }

  const data = resObj['data'];
  const dataObj = asRecord(data);
  if (!dataObj) {
    return '';
  }
  const innerId = dataObj['id'];

  return typeof innerId === 'string' && innerId.length > 0 ? innerId : '';
}

function readNombreDesdeRespuesta(response: unknown): string | undefined {
  if (typeof response !== 'object' || response === null) {
    return undefined;
  }
  const nombre = (response as Record<string, unknown>)['nombre'];
  return typeof nombre === 'string' ? nombre : undefined;
}

/**
 * Interceptor global para el registro automático de auditoría.
 * Captura las respuestas exitosas de métodos decorados con @AuditAction y emite un AuditEvent.
 * Determina automáticamente el ID de la entidad afectada y el tipo de movimiento si no se especifica.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  /**
   * Crea una instancia de AuditInterceptor.
   * @param reflector Utilidad para acceder a los metadatos de los decoradores.
   * @param eventEmitter Emisor de eventos para registrar la auditoría de forma asíncrona.
   */
  constructor(
    private reflector: Reflector,
    private eventEmitter: EventEmitter2
  ) {}

  /**
   * Intercepta la ejecución de la petición para capturar cambios auditables.
   * @param context Contexto de ejecución de NestJS.
   * @param next Manejador del siguiente paso en la cadena (handler del controlador).
   * @returns Observable con la respuesta del controlador.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const config = this.reflector.get<AuditActionConfig>(
      AUDIT_ACTION_KEY,
      context.getHandler()
    );

    if (!config) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuditHttpRequestLike>();
    const userId = request.user?.id;

    if (typeof userId !== 'string' || userId.length === 0) {
      const urlSafe = typeof request.url === 'string' ? request.url : '';
      this.logger.warn(
        `Audit interceptor: No userId found in request for ${urlSafe}`
      );
      return next.handle();
    }

    return next.handle().pipe(
      tap((response: unknown) => {
        try {
          const entidadId = resolveEntityId(request, response);

          if (!entidadId) {
            this.logger.warn(
              `Audit interceptor: Could not determine entity ID for ${config.entidad}`
            );
            return;
          }

          let tipo = config.tipoMovimiento;
          if (!tipo) {
            const methodUpper =
              typeof request.method === 'string'
                ? request.method.toUpperCase()
                : 'GET';

            switch (methodUpper) {
              case 'POST':
                tipo = TipoMovimiento.ENTRADA;
                break;
              case 'PATCH':
              case 'PUT':
                tipo = TipoMovimiento.AJUSTE;
                break;
              case 'DELETE':
                tipo = TipoMovimiento.SALIDA;
                break;
              default:
                tipo = TipoMovimiento.AJUSTE;
            }
          }

          let defaultDesc = '';
          if (tipo === TipoMovimiento.ENTRADA)
            defaultDesc = `Creación de ${config.entidad.toLowerCase()}`;
          if (tipo === TipoMovimiento.AJUSTE)
            defaultDesc = `Actualización de ${config.entidad.toLowerCase()}`;
          if (tipo === TipoMovimiento.SALIDA)
            defaultDesc = `Eliminación de ${config.entidad.toLowerCase()}`;

          const rawMethod =
            typeof request.method === 'string' ? request.method : 'GET';
          const rawUrl = typeof request.url === 'string' ? request.url : '';

          if (
            rawMethod.toUpperCase() === 'POST' &&
            rawUrl.includes('duplicate') &&
            typeof request.body?.newName === 'string' &&
            request.body.newName.length > 0
          ) {
            defaultDesc = `Duplicación de ${config.entidad.toLowerCase()} hacia: ${request.body.newName}`;
          } else {
            const nombreResp = readNombreDesdeRespuesta(response);
            if (nombreResp) {
              defaultDesc += ` (${nombreResp})`;
            }
          }

          const event = new AuditEvent(
            userId,
            tipo,
            config.entidad,
            entidadId,
            config.descripcion || defaultDesc
          );

          this.eventEmitter.emit('audit.log', event);
        } catch (e) {
          this.logger.error(`Error processing audit interceptor`, e);
        }
      })
    );
  }
}
