import { SetMetadata } from '@nestjs/common';

/**
 * Documentación en español.
 */
export const RESOURCE_KEY = 'resource';

/**
 * Documentación en español.
 */
export const Resource = (resource: string) =>
  SetMetadata(RESOURCE_KEY, resource);
