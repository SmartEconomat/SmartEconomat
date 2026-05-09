import type { Page } from '@playwright/test';

/**
 * Cierra el tour del tutorial si está visible (no falla si no hay tour).
 */
export async function dismissTutorialIfVisible(page: Page): Promise<void> {
  const candidates = [
    page.getByRole('button', { name: /Saltar todo el tutorial/i }),
    page.getByRole('button', { name: /tutorial\.omitirTour/i }),
  ];

  for (const candidate of candidates) {
    if (
      await candidate
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await candidate.first().click({ force: true });
      return;
    }
  }
}
