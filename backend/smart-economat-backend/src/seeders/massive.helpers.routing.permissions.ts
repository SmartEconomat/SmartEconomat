import { SeedContext } from './seed-context';
import { HttpMethod } from './massive.types';
import { ALERGEN_VALUES } from './massive.config';
import {
  consumeStateValue,
  getStateArray,
  pickRequiredStateValue,
} from './massive.state';

/**
 * Expone "resolvePermissionPath" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {string} path - Entrada efectiva esperada por el contrato.
 * @undefined {HttpMethod} method - Entrada efectiva esperada por el contrato.
 * @undefined {number} iteration - Entrada efectiva esperada por el contrato.
 * @undefined {string | null} Datos efectivos después de ejecutar la operación.
 */
export function resolvePermissionPath(
  context: SeedContext,
  path: string,
  method: HttpMethod,
  iteration: number
): string | null {
  const isAdditional = path.includes('/permisos-adicionales/:permisoId');
  const isExcluded = path.includes('/permisos-excluidos/:permisoId');
  if (!isAdditional && !isExcluded) {
    return null;
  }

  const pairKey = isAdditional
    ? 'usuarioPermisoAdicionalPairs'
    : 'usuarioPermisoExcluidoPairs';

  const protectedUserIds = new Set(
    getStateArray(context, 'seedProtectedUserIds')
  );

  const pickMutationUserId = (): string => {
    const mutableUserIds = getStateArray(context, 'seedMutableUserIds').filter(
      (id) => !protectedUserIds.has(id)
    );

    if (mutableUserIds.length > 0) {
      return mutableUserIds[iteration % mutableUserIds.length] || '';
    }

    const availableUserIds = getStateArray(context, 'usuarioIds').filter(
      (id) => !protectedUserIds.has(id)
    );
    if (availableUserIds.length > 0) {
      return availableUserIds[iteration % availableUserIds.length] || '';
    }

    return pickRequiredStateValue(context, 'usuarioIds', iteration);
  };

  if (method === 'DELETE') {
    let pair = consumeStateValue(context, pairKey, '');
    while (pair) {
      const [userId, permisoId] = pair.split('|');
      if (userId && permisoId && !protectedUserIds.has(userId)) {
        return path.replace(':id', userId).replace(':permisoId', permisoId);
      }
      pair = consumeStateValue(context, pairKey, '');
    }
  }

  const userId = pickMutationUserId();
  const permisoId = pickRequiredStateValue(context, 'permissionIds', iteration);
  return path.replace(':id', userId).replace(':permisoId', permisoId);
}

/**
 * Expone "resolveAlergenoDeletePath" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {string} path - Entrada efectiva esperada por el contrato.
 * @undefined {number} iteration - Entrada efectiva esperada por el contrato.
 * @undefined {string | null} Datos efectivos después de ejecutar la operación.
 */
export function resolveAlergenoDeletePath(
  context: SeedContext,
  path: string,
  iteration: number
): string | null {
  if (path !== '/producto-alergenos/:idProducto/:alergeno') {
    return null;
  }

  const deletablePair = consumeStateValue(
    context,
    'seedCreatedDeletableProductoAlergenoPairs',
    ''
  );
  if (deletablePair) {
    const [idProducto, alergeno] = deletablePair.split('|');
    if (idProducto && alergeno) {
      return path
        .replace(':idProducto', idProducto)
        .replace(':alergeno', alergeno);
    }
  }

  const pair = consumeStateValue(context, 'productoAlergenoPairs', '');
  if (pair) {
    const [idProducto, alergeno] = pair.split('|');
    if (idProducto && alergeno) {
      return path
        .replace(':idProducto', idProducto)
        .replace(':alergeno', alergeno);
    }
  }

  return path
    .replace(
      ':idProducto',
      pickRequiredStateValue(context, 'productoIds', iteration)
    )
    .replace(':alergeno', ALERGEN_VALUES[iteration % ALERGEN_VALUES.length]);
}
