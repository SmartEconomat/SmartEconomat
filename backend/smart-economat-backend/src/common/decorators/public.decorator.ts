import { SetMetadata } from '@nestjs/common';

/**
 * Documentación en español.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Documentación en español.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
