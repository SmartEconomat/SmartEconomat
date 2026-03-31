import { faker } from '@faker-js/faker';
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
    nombre: `Seed ${env.suffix}`,
    descripcion: faker.lorem.sentence(),
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
