import { Endpoint } from './massive.types';
import { SeedContext } from './seed-context';
import { ALERGEN_VALUES } from './massive.config';
import {
  resolveAlergenoDeletePath,
  resolvePermissionPath,
} from './massive.helpers.routing.permissions';
import { pickIdForRoute } from './massive.helpers.routing.pick-id';
import {
  getStateArray,
  pickRequiredStateValue,
  pickStateValue,
} from './massive.state';

export function resolvePathParams(
  context: SeedContext,
  endpoint: Endpoint,
  iteration: number
): string {
  const path = endpoint.path;

  const permissionPath = resolvePermissionPath(
    context,
    path,
    endpoint.method,
    iteration
  );
  if (permissionPath) {
    return permissionPath;
  }

  const alergenoDeletePath = resolveAlergenoDeletePath(
    context,
    path,
    iteration
  );
  if (alergenoDeletePath) {
    return alergenoDeletePath;
  }

  let resolved = path;

  let aulaValue = '';
  let claseValue = '';
  if (resolved.includes(':aula') || resolved.includes(':clase')) {
    const aulaClasePairs = getStateArray(context, 'seedAulaClasePairs');
    if (aulaClasePairs.length === 0) {
      throw new Error(
        `[seed-massive] No hay pares aula|clase para resolver ruta ${resolved}`
      );
    }
    const pair = aulaClasePairs[iteration % aulaClasePairs.length] || '';
    const [aula, clase] = pair.split('|');
    if (!aula || !clase) {
      throw new Error(
        `[seed-massive] Par aula|clase inválido: "${pair}" para ruta ${resolved}`
      );
    }
    aulaValue = aula;
    claseValue = clase;
  }

  if (resolved.includes(':idProducto')) {
    resolved = resolved.replace(
      ':idProducto',
      pickRequiredStateValue(context, 'productoIds', iteration)
    );
  }
  if (resolved.includes(':productoId')) {
    const candidate =
      pickStateValue(context, 'productoConProveedorIds', iteration, '') ||
      pickRequiredStateValue(context, 'productoIds', iteration);
    resolved = resolved.replace(':productoId', candidate);
  }
  if (resolved.includes(':permisoId')) {
    resolved = resolved.replace(
      ':permisoId',
      pickRequiredStateValue(context, 'permissionIds', iteration)
    );
  }
  if (resolved.includes(':filename')) {
    const selectedFilename = resolved.startsWith('/albaranes/documento/')
      ? pickRequiredStateValue(context, 'albaranDocumentFilenames', iteration)
      : pickRequiredStateValue(context, 'archivoFilenames', iteration);

    resolved = resolved.replace(':filename', selectedFilename);
  }
  if (resolved.includes(':codigoClase')) {
    resolved = resolved.replace(
      ':codigoClase',
      pickRequiredStateValue(context, 'seedClassCodes', iteration)
    );
  }
  if (resolved.includes(':aula')) {
    resolved = resolved.replace(':aula', encodeURIComponent(aulaValue));
  }
  if (resolved.includes(':clase')) {
    resolved = resolved.replace(':clase', claseValue);
  }
  if (resolved.includes(':alergeno')) {
    const alergeno = ALERGEN_VALUES[iteration % ALERGEN_VALUES.length];
    resolved = resolved.replace(':alergeno', alergeno);
  }
  if (resolved.includes(':id')) {
    resolved = resolved.replace(
      ':id',
      pickIdForRoute(context, path, endpoint.method, iteration)
    );
  }

  return resolved;
}
