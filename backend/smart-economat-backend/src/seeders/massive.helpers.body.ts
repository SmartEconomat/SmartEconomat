import { buildBodyAuthUsers } from './massive.helpers.body.auth-users';
import { buildBodyCatalogProducts } from './massive.helpers.body.catalog';
import {
  BuildBodyEnv,
  createBuildBodyEnv,
} from './massive.helpers.body.shared';
import { buildBodyInventoryAndProduction } from './massive.helpers.body.inventory-production';
import { buildBodyOrdersAndReception } from './massive.helpers.body.orders';
import { SeedContext } from './seed-context';
import { Endpoint, EnumCoverage } from './massive.types';
import {
  DETERMINISTIC_SHORT_NOTES,
  pickDeterministic,
} from './deterministic.seed-data';

/**
 * Expone "buildBody" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {Endpoint} endpoint - Entrada efectiva esperada por el contrato.
 * @undefined {string} resolvedPath - Entrada efectiva esperada por el contrato.
 * @undefined {number} iteration - Entrada efectiva esperada por el contrato.
 * @undefined {EnumCoverage} coverage - Entrada efectiva esperada por el contrato.
 * @undefined {Record<string, unknown>} Datos efectivos después de ejecutar la operación.
 */
export function buildBody(
  context: SeedContext,
  endpoint: Endpoint,
  resolvedPath: string,
  iteration: number,
  coverage: EnumCoverage
): Record<string, unknown> {
  const env = createBuildBodyEnv(
    context,
    endpoint,
    resolvedPath,
    iteration,
    coverage
  );

  const body = buildBodyFromModules(env);
  if (body) {
    return body;
  }

  return {
    nombre: `Registro seed ${env.suffix}`,
    descripcion: pickDeterministic(
      DETERMINISTIC_SHORT_NOTES,
      env.iteration,
      'fallback-description'
    ),
  };
}

function buildBodyFromModules(
  env: BuildBodyEnv
): Record<string, unknown> | undefined {
  return (
    buildBodyAuthUsers(env) ||
    buildBodyCatalogProducts(env) ||
    buildBodyOrdersAndReception(env) ||
    buildBodyInventoryAndProduction(env)
  );
}
