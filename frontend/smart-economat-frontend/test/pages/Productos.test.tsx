import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import Productos from '../../src/pages/Productos';
import * as productoService from '../../src/services/producto.service';
import * as openFoodFactsService from '../../src/services/openfoodfacts.service';
import * as productoProveedorService from '../../src/services/productoProveedor.service';

const barcodeScannerMock = vi.hoisted(() => ({
  props: null as null | {
    open?: boolean;
    onScan?: (code: string) => void;
    onClose?: () => void;
  },
}));

const onSearchChangeMock = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../src/store/toast.hooks', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('../../src/store/auth.hooks', () => ({
  usePermission: () => true,
}));

vi.mock('../../src/store/sidebar.hooks', () => ({
  useSidebar: () => ({ isExpanded: false }),
}));

vi.mock('../../src/utils/useBreakpoints', () => ({
  useBreakpoints: () => ({ screenWidth: 1600 }),
}));

vi.mock('../../src/hooks/useDataTable', () => ({
  useDataTable: () => ({
    searchTerm: '',
    filters: {},
    onPageChange: vi.fn(),
    onSort: vi.fn(),
    onFilter: vi.fn(),
    onSearchChange: onSearchChangeMock,
    queryParams: {
      page: 1,
      limit: 10,
      searchTerm: '',
      sortBy: 'nombre',
      order: 'asc',
    },
    sortConfig: null,
    paginationProps: {
      page: 0,
      count: 1,
      rowsPerPage: 10,
      onPageChange: vi.fn(),
      onRowsPerPageChange: vi.fn(),
    },
    totalItems: 0,
    syncPaginationFromResponse: vi.fn(),
  }),
}));

vi.mock('../../src/components/ui/PageToolbar', () => ({
  default: ({ onScanBarcode }: { onScanBarcode?: () => void }) => (
    <button onClick={onScanBarcode} aria-label="scan-productos-toolbar">
      scan-productos-toolbar
    </button>
  ),
}));

vi.mock('../../src/components/ui/DataTable', () => ({
  default: ({ data }: { data: Array<{ nombre?: string }> }) => (
    <div>
      <div>productos-data-table</div>
      <div data-testid="productos-first-row">
        {data[0]?.nombre ?? 'sin-datos'}
      </div>
    </div>
  ),
}));

vi.mock('../../src/components/ui/ConfirmDialog', () => ({
  default: () => null,
}));

vi.mock('../../src/components/ui/DetailModal', () => ({
  default: () => null,
}));

vi.mock('../../src/features/productos/ProductCard', () => ({
  default: () => null,
}));

vi.mock('../../src/features/productos/ProductFilters', () => ({
  default: () => null,
}));

vi.mock('../../src/features/productos/ProductoFormModal', () => ({
  default: () => null,
}));

vi.mock('../../src/components/ui/LinearLoader', () => ({
  default: () => <div>linear-loader</div>,
}));

vi.mock('../../src/components/ui/BarcodeScanner', () => ({
  default: (props: {
    open?: boolean;
    onScan?: (code: string) => void;
    onClose?: () => void;
  }) => {
    barcodeScannerMock.props = props;

    return props.open ? (
      <button
        aria-label="emit-productos-scan"
        onClick={() => {
          props.onScan?.(' 7501055300034 ');
        }}
      >
        emit-productos-scan
      </button>
    ) : null;
  },
}));

vi.mock('../../src/services/producto.service', () => ({
  fetchProductos: vi.fn(),
  createProducto: vi.fn(),
  updateProducto: vi.fn(),
  restoreProducto: vi.fn(),
  fetchHistorialPrecios: vi.fn(),
  invalidateProductosCache: vi.fn(),
  getProductoByBarcode: vi.fn(),
}));

vi.mock('../../src/services/openfoodfacts.service', () => ({
  searchByBarcode: vi.fn(),
}));

vi.mock('../../src/services/productoProveedor.service', () => ({
  fetchComparacionProveedores: vi.fn(),
}));

describe('Productos page scanner integration', () => {
  const buildProducto = (id: string, nombre: string) => ({
    id,
    nombre,
    contenido: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    barcodeScannerMock.props = null;
    onSearchChangeMock.mockReset();

    vi.mocked(productoService.fetchProductos).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    vi.mocked(
      productoProveedorService.fetchComparacionProveedores
    ).mockResolvedValue({
      productoId: 'prod-1',
      productoNombre: 'Producto',
      proveedores: [],
    });
    vi.mocked(productoService.getProductoByBarcode).mockResolvedValue(null);
    vi.mocked(openFoodFactsService.searchByBarcode).mockResolvedValue(null);
  });

  it('envía el código escaneado al flujo de búsqueda de Productos', async () => {
    render(
      <MemoryRouter>
        <Productos />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(productoService.fetchProductos).toHaveBeenCalled();
    });

    act(() => {
      screen.getByRole('button', { name: 'scan-productos-toolbar' }).click();
    });

    await waitFor(() => {
      expect(barcodeScannerMock.props?.open).toBe(true);
    });

    act(() => {
      screen.getByRole('button', { name: 'emit-productos-scan' }).click();
    });

    await waitFor(() => {
      expect(onSearchChangeMock).toHaveBeenCalledWith('7501055300034');
      expect(productoService.getProductoByBarcode).toHaveBeenCalledWith(
        '7501055300034'
      );
      expect(openFoodFactsService.searchByBarcode).toHaveBeenCalledWith(
        '7501055300034'
      );
    });
  });

  it('ignora respuestas antiguas cuando hay dos cargas concurrentes', async () => {
    let resolveFirstCall:
      | ((value: {
          data: Array<{
            id: string;
            nombre: string;
            contenido: number;
            createdAt: string;
            updatedAt: string;
          }>;
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }) => void)
      | undefined;

    const firstCallPromise = new Promise<{
      data: Array<{
        id: string;
        nombre: string;
        contenido: number;
        createdAt: string;
        updatedAt: string;
      }>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>((resolve) => {
      resolveFirstCall = resolve;
    });

    const latestPayload = {
      data: [buildProducto('prod-new', 'Producto Nuevo')],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    vi.mocked(productoService.fetchProductos)
      .mockImplementation(() => Promise.resolve(latestPayload))
      .mockImplementationOnce(() => firstCallPromise)
      .mockImplementationOnce(() => Promise.resolve(latestPayload));

    render(
      <MemoryRouter>
        <Productos />
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(
          vi.mocked(productoService.fetchProductos).mock.calls.length
        ).toBeGreaterThan(0);
      },
      { timeout: 15_000 }
    );

    act(() => {
      screen.getByRole('tab', { name: 'comun.eliminados' }).click();
    });

    await waitFor(
      () => {
        expect(
          vi
            .mocked(productoService.fetchProductos)
            .mock.calls.some(
              (call) =>
                typeof call[0] === 'object' &&
                call[0] !== null &&
                (call[0] as { soloEliminados?: boolean }).soloEliminados ===
                  true
            )
        ).toBe(true);
        expect(screen.getByTestId('productos-first-row')).toHaveTextContent(
          'Producto Nuevo'
        );
      },
      { timeout: 15_000 }
    );

    await act(async () => {
      resolveFirstCall?.({
        data: [buildProducto('prod-old', 'Producto Antiguo')],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    await waitFor(
      () => {
        expect(screen.getByTestId('productos-first-row')).toHaveTextContent(
          'Producto Nuevo'
        );
        expect(screen.getByTestId('productos-first-row')).not.toHaveTextContent(
          'Producto Antiguo'
        );
      },
      { timeout: 15_000 }
    );
  }, 30_000);
});
