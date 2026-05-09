import { expect, test, type Page } from '@playwright/test';

import { bootstrapSession, installApiMocks } from './helpers/session';

type ApiEnvelope<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

type ProductoRecord = {
  id: string;
  nombre: string;
  marca?: string;
  unidad: string;
  tipo: string;
  contenido: number;
  codigoBarras?: string;
  deletedAt?: string | null;
  activo?: boolean;
};

type ProveedorRecord = {
  id: string;
  nombre: string;
  nif?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  deletedAt?: string | null;
};

function okJson<T>(data: T, message = 'ok') {
  const body: ApiEnvelope<T> = {
    statusCode: 200,
    success: true,
    message,
    data,
  };
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

function errorJson(status: number, message: string) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify({
      statusCode: status,
      success: false,
      message,
      error: message,
    }),
  };
}

async function dismissTutorialIfVisible(page: Page): Promise<void> {
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

async function markToursAsSeen(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('sm_tutorial_completed', 'true');
    window.localStorage.setItem('has_seen_tour_/productos', 'true');
    window.localStorage.setItem('has_seen_tour_/proveedores', 'true');
    window.localStorage.setItem('has_seen_tour_/recepciones', 'true');
    window.localStorage.setItem('has_seen_tour_/pedidos', 'true');
  });
}

async function installAuth(page: Page, permisos: string[]): Promise<void> {
  await page.route('**/api/v1/usuarios/perfil**', async (route) => {
    await route.fulfill(
      okJson({
        id: 'e2e-user-id',
        username: 'qa-business',
        nombre: 'QA Business',
        email: 'qa-business@smarteconomat.local',
        rol: 'admin',
        permisos,
        preferences: {
          tutorialCompleted: true,
        },
      })
    );
  });
}

test.describe('Suite E2E negocio crítico', () => {
  test.describe.configure({ timeout: 60000 });
  test('productos: crear, editar, eliminar y validar error backend', async ({
    page,
  }) => {
    await bootstrapSession(page);
    await markToursAsSeen(page);
    await installApiMocks(page);
    await installAuth(page, [
      'productos:listar',
      'productos:crear',
      'productos:editar',
      'productos:eliminar',
      'proveedores:listar',
    ]);

    const productos: ProductoRecord[] = [];
    const proveedores: ProveedorRecord[] = [
      { id: 'prov-1', nombre: 'Proveedor Central', nif: 'A12345678' },
    ];
    let forceValidationError = false;

    await page.route('**/api/v1/proveedor?**', async (route) => {
      await route.fulfill(
        okJson({
          data: proveedores.filter((item) => !item.deletedAt),
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
        })
      );
    });

    await page.route('**/api/v1/productos**', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      if (forceValidationError) {
        await route.fulfill(
          errorJson(400, 'EL_NOMBRE_NO_PUEDE_EXCEDER_LOS_100_CARAC')
        );
        return;
      }

      const payload = route.request().postDataJSON() as {
        nombre: string;
        unidad: string;
        tipo: string;
        contenido: number;
        codigoBarras?: string;
      };
      const nuevo: ProductoRecord = {
        id: `prod-${productos.length + 1}`,
        nombre: payload.nombre,
        unidad: payload.unidad,
        tipo: payload.tipo,
        contenido: payload.contenido,
        codigoBarras: payload.codigoBarras,
        activo: true,
      };
      productos.unshift(nuevo);
      await route.fulfill(okJson(nuevo, 'Producto creado'));
    });

    // GET catálogo: registro específico (último en cadena) para no confundir con /generar-ean13, etc.
    await page.route(
      (url) => url.pathname.replace(/\/+$/, '') === '/api/v1/productos',
      async (route) => {
        if (route.request().method() !== 'GET') {
          await route.fallback();
          return;
        }
        const reqUrl = new URL(route.request().url());
        const soloEliminados =
          reqUrl.searchParams.get('soloEliminados') === 'true';
        const data = soloEliminados
          ? productos.filter((item) => Boolean(item.deletedAt))
          : productos.filter(
              (item) => !item.deletedAt && item.activo !== false
            );
        await route.fulfill(
          okJson({
            data,
            total: data.length,
            page: 1,
            limit: 20,
            totalPages: 1,
          })
        );
      }
    );

    await page.route('**/api/v1/productos/*', async (route) => {
      const method = route.request().method();
      const id = route.request().url().split('/').pop() ?? '';
      const producto = productos.find((item) => item.id === id);

      if (!producto) {
        await route.fulfill(errorJson(404, 'Producto no encontrado'));
        return;
      }

      if (method === 'PATCH') {
        const payload = route.request().postDataJSON() as {
          nombre?: string;
          contenido?: number;
        };
        producto.nombre = payload.nombre ?? producto.nombre;
        producto.contenido = payload.contenido ?? producto.contenido;
        await route.fulfill(okJson(producto, 'Producto actualizado'));
        return;
      }

      if (method === 'DELETE') {
        producto.deletedAt = new Date().toISOString();
        await route.fulfill({ status: 204, body: '' });
        return;
      }

      await route.fallback();
    });

    await page.goto('/productos', { waitUntil: 'domcontentloaded' });
    await dismissTutorialIfVisible(page);

    const newProductButton = page.getByTestId('btn-nuevo-producto').first();
    const productosTable = page.getByRole('table', { name: /Tabla de datos/i });
    await expect(newProductButton).toBeVisible({ timeout: 20_000 });
    await newProductButton.click();
    const modal = page.getByRole('dialog', { name: /Crear Nuevo Producto/i });
    await expect(modal).toBeVisible();
    await modal.getByLabel('Nombre Comercial').fill('Arroz Integral QA');
    await modal.getByLabel('Contenido Numérico').fill('2');
    await modal.getByRole('button', { name: 'Crear Producto' }).click();
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(productosTable.getByText('Arroz Integral QA')).toBeVisible();

    const editButtons = page.getByLabel(/editar/i);
    await editButtons.first().click();
    const editModal = page.getByRole('dialog', { name: /Editar:/i });
    await editModal.getByLabel('Nombre Comercial').fill('Arroz Integral QA V2');
    await editModal.getByRole('button', { name: 'Guardar Cambios' }).click();
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(
      productosTable.getByText('Arroz Integral QA V2')
    ).toBeVisible();

    await page
      .getByLabel(/eliminar/i)
      .first()
      .click();
    await page.getByRole('button', { name: /Eliminar/i }).click();
    await expect(productosTable.getByText('Arroz Integral QA V2')).toHaveCount(
      0
    );

    forceValidationError = true;
    await newProductButton.click();
    const errorModal = page.getByRole('dialog', {
      name: /Crear Nuevo Producto/i,
    });
    await errorModal
      .getByLabel('Nombre Comercial')
      .fill('Producto inválido QA');
    await errorModal.getByRole('button', { name: 'Crear Producto' }).click();
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(
      page.getByText(/EL_NOMBRE_NO_PUEDE_EXCEDER_LOS_100_CARAC/i)
    ).toBeVisible();
  });

  test('proveedores: create-edit-delete-restore + invalidación backend', async ({
    page,
  }) => {
    await bootstrapSession(page);
    await markToursAsSeen(page);
    await installApiMocks(page);
    await installAuth(page, [
      'proveedores:listar',
      'proveedores:crear',
      'proveedores:editar',
      'proveedores:eliminar',
      'ADMIN',
    ]);

    const proveedores: ProveedorRecord[] = [
      {
        id: 'prov-1',
        nombre: 'Proveedor Norte',
        nif: 'B11111111',
        contacto: 'Ana',
      },
    ];
    let rejectCreate = false;

    await page.route('**/api/v1/proveedor?**', async (route) => {
      const includeDeleted = route
        .request()
        .url()
        .includes('includeDeleted=true');
      const data = includeDeleted
        ? proveedores
        : proveedores.filter((item) => !item.deletedAt);
      await route.fulfill(
        okJson({
          data,
          total: data.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        })
      );
    });

    await page.route('**/api/v1/proveedor', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      if (rejectCreate) {
        await route.fulfill(
          errorJson(400, 'El nombre del proveedor es obligatorio.')
        );
        return;
      }
      const payload = route.request().postDataJSON() as ProveedorRecord;
      const created: ProveedorRecord = {
        id: `prov-${proveedores.length + 1}`,
        nombre: payload.nombre,
        nif: payload.nif,
        contacto: payload.contacto,
        telefono: payload.telefono,
        email: payload.email,
      };
      proveedores.push(created);
      await route.fulfill(okJson(created, 'Proveedor creado'));
    });

    await page.route('**/api/v1/proveedor/*/restore', async (route) => {
      const id = route.request().url().split('/').slice(-2)[0] ?? '';
      const proveedor = proveedores.find((item) => item.id === id);
      if (!proveedor) {
        await route.fulfill(errorJson(404, 'Proveedor no encontrado'));
        return;
      }
      proveedor.deletedAt = null;
      await route.fulfill(okJson(proveedor, 'Proveedor restaurado'));
    });

    await page.route('**/api/v1/proveedor/*', async (route) => {
      const id = route.request().url().split('/').pop() ?? '';
      const proveedor = proveedores.find((item) => item.id === id);
      if (!proveedor) {
        await route.fulfill(errorJson(404, 'Proveedor no encontrado'));
        return;
      }
      if (route.request().method() === 'PATCH') {
        const payload = route.request().postDataJSON() as ProveedorRecord;
        proveedor.contacto = payload.contacto ?? proveedor.contacto;
        await route.fulfill(okJson(proveedor, 'Proveedor actualizado'));
        return;
      }
      if (route.request().method() === 'DELETE') {
        proveedor.deletedAt = new Date().toISOString();
        await route.fulfill({ status: 204, body: '' });
        return;
      }
      await route.fallback();
    });

    await page.goto('/proveedores', { waitUntil: 'domcontentloaded' });

    await page.locator('#btn-nuevo-proveedor').first().click({ force: true });
    let modal = page.getByRole('dialog', { name: /Crear Nuevo Proveedor/i });
    await modal.getByLabel(/NIF/i).fill('B22222222');
    await modal.getByLabel(/Razón Social/i).fill('Proveedor Sur QA');
    await modal.getByRole('button', { name: /Aceptar/i }).click();
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(page.getByText('Proveedor Sur QA')).toBeVisible();

    await page
      .getByLabel(/editar/i)
      .first()
      .click();
    modal = page.getByRole('dialog', { name: /Editar/i });
    await modal.getByLabel(/Persona de Contacto/i).fill('Contacto QA');
    await modal.getByRole('button', { name: /Aceptar/i }).click();
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(page.getByText('Contacto QA')).toBeVisible();

    await page
      .getByLabel(/eliminar/i)
      .first()
      .click();
    await page.getByRole('button', { name: /Eliminar/i }).click();

    rejectCreate = true;
    await page.locator('#btn-nuevo-proveedor').click();
    modal = page.getByRole('dialog', { name: /Crear Nuevo Proveedor/i });
    await modal.getByLabel(/NIF/i).fill('B33333333');
    await modal.getByLabel(/Razón Social/i).fill('Proveedor Fallido QA');
    await modal.getByRole('button', { name: /Aceptar/i }).click();
    await page.getByRole('button', { name: /Guardar/i }).click();
    await expect(
      page.getByText(/El nombre del proveedor es obligatorio/i)
    ).toBeVisible();
  });

  test('recepciones: regla de notas obligatorias en discrepancias', async ({
    page,
  }) => {
    await bootstrapSession(page);
    await markToursAsSeen(page);
    await installApiMocks(page);
    await installAuth(page, [
      'recepciones:listar',
      'recepciones:crear',
      'pedidos:listar',
    ]);

    await page.route('**/api/v1/pedidos?**', async (route) => {
      await route.fulfill(
        okJson({
          data: [
            {
              id: 'pedido-1',
              fechaPedido: '2026-05-06T08:00:00.000Z',
              estado: 'por_recepcionar',
              proveedor: { id: 'prov-1', nombre: 'Proveedor Norte' },
              pedidoProductos: [
                {
                  id: 'pp-1',
                  cantidad: 2,
                  productoProveedor: {
                    id: 'pprov-1',
                    producto: {
                      id: 'prod-1',
                      nombre: 'Leche UHT',
                      codigoBarras: '8470000000012',
                      unidad: 'L',
                    },
                  },
                },
              ],
            },
          ],
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
        })
      );
    });

    await page.route('**/api/v1/recepciones', async (route) => {
      await route.fulfill(okJson({ id: 'recep-1' }, 'Recepción registrada'));
    });

    await page.goto('/recepciones', { waitUntil: 'domcontentloaded' });
    await dismissTutorialIfVisible(page);
    await page
      .getByRole('button', { name: 'Seleccionar Todos', exact: true })
      .click();
    const nextButtonStepOne = page
      .getByLabel('Contenido principal')
      .getByRole('button', { name: /Siguiente/i })
      .first();
    await nextButtonStepOne.focus();
    await page.keyboard.press('Enter');

    const searchInput = page.locator('#search-recepcion-productos input');
    await searchInput.fill('8470000000012');
    await searchInput.press('Enter');
    const nextButtonStepTwo = page
      .getByLabel('Contenido principal')
      .getByRole('button', { name: /Siguiente/i })
      .first();
    await nextButtonStepTwo.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /Finalizar Recepción/i }).click();

    await expect(
      page.getByText(/campo de notas es obligatorio/i).first()
    ).toBeVisible();
  });

  test('pedidos: filtro de pendientes desde dashboard y limpieza', async ({
    page,
  }) => {
    await bootstrapSession(page);
    await markToursAsSeen(page);
    await installApiMocks(page);
    await installAuth(page, ['pedidos:listar', 'pedidos:crear']);

    await page.route('**/api/v1/pedido-usuarios?**', async (route) => {
      await route.fulfill(
        okJson({
          data: [
            {
              id: 'pu-1',
              numeroGlobal: '1001',
              estado: 'pendiente',
              fechaPedido: '2026-05-06T08:00:00.000Z',
              proveedor: null,
              pedidos: [],
              pedidoProductos: [],
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        })
      );
    });

    await page.route('**/api/v1/purchase-batches**', async (route) => {
      await route.fulfill(okJson([]));
    });
    await page.route('**/api/v1/proveedores**', async (route) => {
      await route.fulfill(okJson({ data: [], total: 0, totalPages: 1 }));
    });

    await page.goto('/pedidos?tab=0&ownStatus=pendientes', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(/ownStatus=pendientes/);
    await page.getByRole('button', { name: /Quitar/i }).click();
    await expect(page).toHaveURL(/\/pedidos$/);
  });

  test('incidencias: filtro por resolver desde dashboard y limpieza', async ({
    page,
  }) => {
    await bootstrapSession(page);
    await markToursAsSeen(page);
    await installApiMocks(page);
    await installAuth(page, ['incidencias:listar', 'ADMIN']);

    await page.route('**/api/v1/incidencias**', async (route) => {
      await route.fulfill(
        okJson({
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        })
      );
    });

    await page.goto('/incidencias?resolucion=por_resolver', {
      waitUntil: 'domcontentloaded',
    });
    await dismissTutorialIfVisible(page);
    await expect(page).toHaveURL(/resolucion=por_resolver/);
    await expect(page.getByRole('alert')).toContainText(/dashboard/i);
    await page.getByRole('button', { name: /Quitar/i }).click();
    await expect(page).toHaveURL(/\/incidencias$/);
  });

  test('inventario: filtro de stock bajo desde dashboard y limpieza', async ({
    page,
  }) => {
    await bootstrapSession(page);
    await markToursAsSeen(page);
    await installApiMocks(page);
    await installAuth(page, [
      'inventario:listar',
      'ubicaciones:listar',
      'ADMIN',
    ]);

    let inventarioRequestObserved = false;

    await page.route('**/api/v1/ubicacion', async (route) => {
      await route.fulfill(
        okJson([
          {
            id: 'ubi-1',
            nombre: 'Despensa Principal',
            activo: true,
          },
        ])
      );
    });

    await page.route('**/api/v1/inventario**', async (route) => {
      inventarioRequestObserved = true;
      await route.fulfill(okJson([]));
    });

    await page.goto('/inventario?filter=stockBajo', {
      waitUntil: 'domcontentloaded',
    });
    await dismissTutorialIfVisible(page);

    await expect(page.getByRole('alert')).toContainText(/stock/i);
    await expect.poll(() => inventarioRequestObserved).toBe(true);
    await page.getByRole('button', { name: /Quitar/i }).click();
    await expect(page).toHaveURL(/\/inventario$/);
  });
});
