import { SetMetadata } from '@nestjs/common';
import { TipoMovimiento } from '../../modules/movimiento/enums/movimiento.enums';

/** Clave de metadatos para la configuración de auditoría. */
export const AUDIT_ACTION_KEY = 'audit_action_config';

/**
 * Configuración para el registro automático de auditoría.
 */
export interface AuditActionConfig {
  /** Nombre de la entidad (ej: 'Producto', 'Proveedor'). */
  entidad: string;
  /** Tipo de movimiento a registrar. Si se omite, se infiere del método HTTP. */
  tipoMovimiento?: TipoMovimiento;
  /** Descripción personalizada para el log. */
  descripcion?: string;
}

/**
 * Decorador para marcar controladores o métodos que deben ser auditados automáticamente.
 * El interceptor AuditInterceptor procesará estos metadatos tras una respuesta exitosa.
 * @param entidad Nombre de la entidad afectada.
 * @param tipoMovimiento Categoría del movimiento.
 * @param descripcion Explicación personalizada del cambio.
 */
/**
 * Expone "AuditAction" en smart-economat-backend (Nest).
 * @undefined {string} entidad - Entrada efectiva esperada por el contrato.
 * @undefined {TipoMovimiento | undefined} tipoMovimiento - Entrada efectiva esperada por el contrato.
 * @undefined {string | undefined} descripcion - Entrada efectiva esperada por el contrato.
 * @undefined {import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@nestjs/common/index").CustomDecorator<string>} Datos efectivos después de ejecutar la operación.
 */
export const AuditAction = (
  entidad: string,
  tipoMovimiento?: TipoMovimiento,
  descripcion?: string
) => SetMetadata(AUDIT_ACTION_KEY, { entidad, tipoMovimiento, descripcion });
