import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import Inventario from '../../src/pages/Inventario';
import * as inventarioService from '../../src/services/inventario.service';
import { UbicacionService } from '../../src/services/ubicacion.service';
import { profesorService } from '../../src/services/profesor.service';
import * as productoService from '../../src/services/producto.service';
import * as authHooks from '../../src/store/auth.hooks';
import * as toastHooks from '../../src/store/toast.hooks';

const dynamicFormMock = vi.hoisted(() => ({
  props: null as null | {
    isOpen?: boolean;
    onSubmit?: (data: Record<string, unknown>) => Promise<void>;
  },
}));

const barcodeScannerMock = vi.hoisted(() => ({
  props: null as null | {
    open?: boolean;
    onScan?: (code: string) => void;
    onClose?: () => void;
  },
}));

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
    onScanBarcode,
  }: {
    title?: React.ReactNode;
    searchPlaceholder?: React.ReactNode;
    totalItemsLabel?: React.ReactNode;
    onScanBarcode?: () => void;
  }) => (
    <div>
      <div>{title}</div>
      <div>{searchPlaceholder}</div>
      <div>{totalItemsLabel}</div>
      {onScanBarcode ? (
        <button onClick={onScanBarcode} aria-label="scan-toolbar">
          scan-toolbar
        </button>
      ) : null}
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
  default: (props: {
    open?: boolean;
    onScan?: (code: string) => void;
    onClose?: () => void;
  }) => {
    barcodeScannerMock.props = props;

    return props.open ? (
      <button
        onClick={() => {
          props.onScan?.(' 8412345678901 ');
        }}
        aria-label="emit-inventario-scan"
      >
        emit-inventario-scan
      </button>
    ) : null;
  },
}));
vi.mock('../../src/components/ui/ConfirmDialog', () => ({
  default: () => null,
}));
vi.mock('../../src/components/ui/DynamicFormModal', () => ({
  default: (props: {
    isOpen?: boolean;
    onSubmit?: (data: Record<string, unknown>) => Promise<void>;
  }) => {
    dynamicFormMock.props = props;
    return props.isOpen ? <div>dynamic-form-open</div> : null;
  },
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
  let toast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dynamicFormMock.props = null;
    barcodeScannerMock.props = null;
    toast = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };
    vi.mocked(toastHooks.useToast).mockReturnValue(toast);
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
      updateUser: vi.fn(),
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(authHooks.usePermission).mockReturnValue(true);
    vi.mocked(inventarioService.fetchInventario).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
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

  it('rechaza precio de proveedor menor a 0.01 al crear producto desde inventario', async () => {
    render(
      <MemoryRouter>
        <Inventario />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(inventarioService.fetchInventario).toHaveBeenCalled();
      expect(dynamicFormMock.props?.onSubmit).toBeDefined();
    });

    act(() => {
      void dynamicFormMock.props?.onSubmit?.({
        nombre: 'Leche',
        unidad: 'L',
        contenido: 1,
        proveedores: [
          {
            proveedorId: 'prov-1',
            precioUnitario: 0,
          },
        ],
      });
    });

    await waitFor(() => {
      expect(vi.mocked(productoService.createProducto)).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        'inventario.crearProductoValidacion.precioProveedorInvalido'
      );
    });
  });

  it('propaga el código escaneado al flujo de búsqueda de inventario', async () => {
    vi.mocked(productoService.getProductoByBarcode).mockResolvedValue(null);

    render(
      <MemoryRouter>
        <Inventario />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(inventarioService.fetchInventario).toHaveBeenCalled();
    });

    act(() => {
      screen.getByRole('button', { name: 'scan-toolbar' }).click();
    });

    await waitFor(() => {
      expect(barcodeScannerMock.props?.open).toBe(true);
    });

    act(() => {
      screen.getByRole('button', { name: 'emit-inventario-scan' }).click();
    });

    await waitFor(() => {
      expect(
        vi.mocked(productoService.getProductoByBarcode)
      ).toHaveBeenCalledWith('8412345678901');
    });
  });
});
