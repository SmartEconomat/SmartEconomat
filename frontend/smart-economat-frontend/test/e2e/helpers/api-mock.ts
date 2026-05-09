import type { Page } from '@playwright/test';

/**
 * Payload JSON estándar del envelope backend (smart-economat).
 */
export function okJsonBody(
  data: unknown,
  status = 200,
  message = 'ok'
): {
  status: number;
  contentType: string;
  body: string;
} {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify({
      statusCode: status,
      success: status >= 200 && status < 300,
      message,
      data,
    }),
  };
}

/**
 * Sesión mínima + APIs comunes (sin catch-all).
 *
 * **Orden con `page.route()`:** Playwright antepone cada ruta (`unshift`), así que la
 * última ruta registrada es la que se evalúa primero. Un patrón comodín tipo
 * `[...]/api/v1/[...]` registrado al final interceptaría también `/usuarios/perfil`.
 * Registra el catch-all **antes** que
 * estos mocks y después añade rutas más específicas por encima.
 */
export async function setupCoreAuthenticatedApiMocks(
  page: Page,
  profile: Record<string, unknown>
): Promise<void> {
  await page.route('**/api/v1/usuarios/perfil**', async (route) => {
    await route.fulfill(okJsonBody(profile));
  });

  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill(
      okJsonBody({ access_token: 'e2e-token' }, 200, 'Login correcto')
    );
  });

  await page.route('**/api/v1/auth/logout', async (route) => {
    await route.fulfill(okJsonBody({}, 200, 'Logout correcto'));
  });

  await page.route('**/api/v1/auth/forgot-password', async (route) => {
    await route.fulfill(okJsonBody({}, 200, 'Recuperación enviada'));
  });
}

export async function setupApiCatchAllEmpty(page: Page): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill(okJsonBody([]));
  });
}
