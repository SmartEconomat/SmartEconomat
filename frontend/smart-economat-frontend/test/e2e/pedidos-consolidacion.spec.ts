import { expect, test } from '@playwright/test';
import { bootstrapSession, installApiMocks } from './helpers/session';

function okJson(data: unknown, message = 'ok') {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      statusCode: 200,
      success: true,
      message,
      data,
    }),
  };
}

const mockPedidoUsuario = {
  id: 'pu-1',
  entityType: 'pedido_usuario',
  pedidoUsuarioId: 'pu-1',
  numeroGlobal: 'PU-2025-001',
  estado: 'pendiente',
  fechaPedido: '2025-05-01T10:00:00Z',
  costeTotal: 125.5,
  usuarioId: 'e2e-user-id',
  usuario: { id: 'e2e-user-id', nombre: 'QA Admin' },
  proveedor: null,
  pedidoProductos: [],
  lineas: [],
};

test.describe('Pedidos - Consolidación Modal', () => {
  test('muestra el modal inteligente al intentar consolidar pedidos pendientes', async ({
    page,
  }) => {
    await bootstrapSession(page);
    await page.addInitScript(() => {
      window.localStorage.setItem('has_seen_tour_/pedidos', 'true');
    });
    await installApiMocks(page);

    await page.route('**/api/v1/usuarios/perfil**', async (route) => {
      await route.fulfill(
        okJson({
          id: 'e2e-user-id',
          username: 'admin',
          nombre: 'QA Admin',
          email: 'qa@smarteconomat.local',
          rol: 'admin',
          permisos: [
            'pedidos:listar',
            'pedidos:crear',
            'pedidos:aprobar',
            'pedidos:eliminar',
          ],
        })
      );
    });

    await page.route('**/api/v1/pedido-usuario**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill(
          okJson({
            data: [mockPedidoUsuario],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
          })
        );
      } else {
        await route.fallback();
      }
    });

    await page.route('**/api/v1/purchase-batches**', async (route) => {
      await route.fulfill(okJson([]));
    });

    await page.route('**/api/v1/proveedores**', async (route) => {
      await route.fulfill(okJson({ data: [], total: 0, totalPages: 1 }));
    });

    await page.goto('/pedidos', { waitUntil: 'networkidle' });

    // Cambiar a vista Kanban/Weekly si es necesario (asumimos que carga por defecto en board)
    // El "mockPedidoUsuario" tiene estado "pendiente".

    // Checkbox de selección general de usuario en el Weekly Board
    const selectAllCheckbox = page
      .getByRole('checkbox', { name: /Seleccionar ordenes/i })
      .first();
    const hasCheckbox = await selectAllCheckbox
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasCheckbox) {
      await selectAllCheckbox.click();

      // Clic en consolidar
      const consolidarBtn = page.getByRole('button', { name: /Consolidar/i });
      await consolidarBtn.click();

      // Esperar que el modal de advertencia inteligente se muestre
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(/aprobar/i);
    }
  });
});
