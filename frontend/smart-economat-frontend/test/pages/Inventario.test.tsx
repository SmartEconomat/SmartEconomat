import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import Inventario from '../../src/pages/Inventario';
import * as inventarioService from '../../src/services/inventario.service';
import { UbicacionService } from '../../src/services/ubicacion.service';
import { profesorService } from '../../src/services/profesor.service';
import * as authHooks from '../../src/store/auth.hooks';
import * as toastHooks from '../../src/store/toast.hooks';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../src/services/inventario.service');
vi.mock('../../src/services/ubicacion.service');
vi.mock('../../src/services/profesor.service');
vi.mock('../../src/store/auth.hooks');
vi.mock('../../src/store/toast.hooks', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  })),
}));
vi.mock('../../src/components/ui/PageToolbar', () => ({
  default: ({
    title,
    searchPlaceholder,
    totalItemsLabel,
  }: {
    title?: React.ReactNode;
    searchPlaceholder?: React.ReactNode;
    totalItemsLabel?: React.ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      <div>{searchPlaceholder}</div>
      <div>{totalItemsLabel}</div>
    </div>
  ),
}));
vi.mock('../../src/components/ui/DataTable', () => ({
  default: ({
    columns,
    emptyStateMessage,
  }: {
    columns: Array<{ id: string; label: React.ReactNode }>;
    emptyStateMessage?: React.ReactNode;
  }) => (
    <div>
      {columns.map((column) => (
        <div key={column.id}>{column.label}</div>
      ))}
      {emptyStateMessage}
    </div>
  ),
}));
vi.mock('../../src/components/ui/BarcodeScanner', () => ({
  default: () => null,
}));
vi.mock('../../src/components/ui/ConfirmDialog', () => ({
  default: () => null,
}));
vi.mock('../../src/components/ui/DynamicFormModal', () => ({
  default: () => null,
}));
vi.mock('../../src/components/inventario/UbicacionesModal', () => ({
  default: () => null,
}));
vi.mock('../../src/components/inventario/InventoryDetailModal', () => ({
  default: () => null,
}));
vi.mock('../../src/features/inventario/InventarioFilters', () => ({
  default: () => null,
}));
vi.mock('../../src/services/proveedor.service', () => ({
  fetchProveedores: vi.fn().mockResolvedValue({
    data: [],
    total: 0,
    totalPages: 1,
  }),
}));
vi.mock('../../src/services/productoProveedor.service', () => ({
  searchProductoProveedor: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../src/services/openfoodfacts.service', () => ({
  searchByBarcode: vi.fn().mockResolvedValue(null),
}));
vi.mock('../../src/services/producto.service', () => ({
  createProducto: vi.fn(),
  getProductoByBarcode: vi.fn(),
}));

describe('Inventario page i18n smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(toastHooks.useToast).mockReturnValue({
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    });
    vi.mocked(authHooks.useAuth).mockReturnValue({
      user: {
        id: 'u-1',
        rol: 'SUPER_ADMIN',
        permisos: [
          'inventario:listar',
          'inventario:crear',
          'ubicaciones:editar',
        ],
        idioma: 'es',
      } as never,
      isAuthenticated: true,
      isAuthResolved: true,
      isSessionVerified: true,
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      refreshUser: vi.fn().mockResolvedValue(null),
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(authHooks.usePermission).mockReturnValue(true);
    vi.mocked(inventarioService.fetchInventario).mockResolvedValue([]);
    vi.mocked(inventarioService.agregarInventarioPorProducto).mockReturnValue(
      []
    );
    vi.mocked(UbicacionService.findAll).mockResolvedValue([]);
    vi.mocked(profesorService.getSlots).mockResolvedValue({
      status: 200,
      data: [],
    } as never);
  });

  afterEach(() => {
    cleanup();
  });

  it('renderiza labels principales traducidos sin hardcodes tecnicos', async () => {
    render(
      <MemoryRouter>
        <Inventario />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(inventarioService.fetchInventario).toHaveBeenCalled();
    });

    expect(screen.getByText('inventario.titulo')).toBeInTheDocument();
    expect(screen.getByText('inventario.buscar')).toBeInTheDocument();
    expect(
      screen.getByText('inventario.columns.stockTotal')
    ).toBeInTheDocument();
    expect(
      screen.getByText('inventario.columns.ubicaciones')
    ).toBeInTheDocument();
  });
});
