import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Recepcion from '../../src/pages/Recepcion';
import { serialService } from '../../src/services/serial.service';
import type {
  RecepcionDraft,
  RecepcionDraftEnvelope,
} from '../../src/services/recepcion.types';

const useRecepcionDraftMock = vi.hoisted(() => vi.fn());

const buildDraft = (): RecepcionDraft => ({
  version: 2,
  creadoEn: '2025-01-01T10:00:00.000Z',
  modificadoEn: '2025-01-01T10:00:00.000Z',
  serverVersion: null,
  serverUpdatedAt: null,
  observaciones: '',
  nAlbaran: '',
  pedidosSeleccionados: [],
  productosEspontaneos: [],
  paso: 'SELECCION_PEDIDOS',
  erroresPorLinea: {},
  enviando: false,
});

const buildPendingDraft = (): RecepcionDraftEnvelope => ({
  version: 3,
  source: 'redis',
  createdAt: '2025-01-01T09:00:00.000Z',
  updatedAt: '2025-01-01T11:30:00.000Z',
  expiresAt: null,
  payload: {
    ...buildDraft(),
    pedidosSeleccionados: [
      {
        id: 'pedido-1',
        descripcion: 'Pedido de prueba',
        proveedor: 'Proveedor de prueba',
        lineas: [],
      },
    ],
    paso: 'ESCANEO_LOTE',
  },
});

const buildHookState = (
  overrides: Partial<ReturnType<typeof useRecepcionDraftMock>> = {}
) => ({
  applyPendingRecoveryDraft: vi.fn(),
  clearDraft: vi.fn(),
  conflict: null,
  draft: buildDraft(),
  isReady: true,
  keepLocalDraft: vi.fn(),
  pendingRecoveryDraft: null,
  setDraft: vi.fn(),
  syncError: null,
  syncStatus: 'synced',
  useRemoteDraft: vi.fn(),
  ...overrides,
});

vi.mock('../../src/services/serial.service', () => {
  return {
    serialService: {
      isSupported: vi.fn(),
      getAuthorizedPorts: vi.fn().mockResolvedValue([]),
      stopContinuousRead: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
    },
  };
});

// Mock hooks to avoid heavy internal logic
vi.mock('../../src/hooks/useRecepcionDraft', () => ({
  useRecepcionDraft: useRecepcionDraftMock,
}));

vi.mock('../../src/services/pedido.service', () => ({
  fetchPedidos: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('../../src/services/recepcion.service', () => ({
  createRecepcion: vi.fn(),
}));

vi.mock('../../src/services/producto.service', () => ({
  getProductoByBarcode: vi.fn(),
  searchProductosByName: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/services/openfoodfacts.service', () => ({
  searchByBarcode: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../src/services/api.service', () => ({
  getAlbaranesAbiertos: vi.fn().mockResolvedValue({ data: [] }),
  getPedidosRecepcionables: vi.fn().mockResolvedValue([]),
  finalizarAlbaran: vi.fn(),
}));

// Ignore missing material UI icons just in case mocking is needed
vi.mock('@mui/icons-material/WarningAmber', () => ({
  default: () => <div data-testid="warning-icon" />,
}));
vi.mock('@mui/icons-material/InfoOutlined', () => ({
  default: () => <div data-testid="info-icon" />,
}));
vi.mock('@mui/icons-material/CheckCircle', () => ({
  default: () => <div data-testid="check-icon" />,
}));

vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
  useDispatch: vi.fn(() => vi.fn()),
}));

vi.mock('../../src/store/auth.hooks', () => ({
  usePermission: vi.fn().mockReturnValue(true),
  useAuth: vi.fn(() => ({
    isAuthResolved: true,
    isSessionVerified: true,
    isAuthenticated: true,
    user: {
      id: 'test-user',
      name: 'Test',
      email: 'test@example.com',
      rol: 'ADMIN',
      permisos: [],
      username: 'test',
      idioma: 'es' as const,
      ubicaciones: [],
      preferences: {},
    },
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    updateUser: vi.fn(),
    changeLanguage: vi.fn(),
  })),
}));

describe('Recepcion component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', {});
    useRecepcionDraftMock.mockReturnValue(buildHookState());
  });

  const customRender = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  it('no debería lanzar error si navigator.serial no tiene addEventListener (caso de error en producción)', async () => {
    vi.mocked(serialService.isSupported).mockReturnValue(true);

    // Simulamos un entorno donde navigator.serial existe pero no tiene los métodos de evento
    vi.stubGlobal('navigator', {
      serial: {}, // object sin addEventListener / removeEventListener
    });

    await act(async () => {
      expect(() => {
        customRender(<Recepcion />);
      }).not.toThrow();
    });
  });

  it('debería asignar los event listeners si navigator.serial soporta eventos', async () => {
    vi.mocked(serialService.isSupported).mockReturnValue(true);

    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();

    vi.stubGlobal('navigator', {
      serial: {
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      },
    });

    let component: ReturnType<typeof render> | undefined;
    await act(async () => {
      component = customRender(<Recepcion />);
    });

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'connect',
      expect.any(Function)
    );
    expect(mockAddEventListener).toHaveBeenCalledWith(
      'disconnect',
      expect.any(Function)
    );

    await act(async () => {
      component?.unmount();
    });

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'connect',
      expect.any(Function)
    );
    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'disconnect',
      expect.any(Function)
    );
  });

  it('solo aplica el borrador pendiente cuando el usuario confirma la recuperación', async () => {
    vi.mocked(serialService.isSupported).mockReturnValue(false);

    const applyPendingRecoveryDraft = vi.fn();
    useRecepcionDraftMock.mockReturnValue(
      buildHookState({
        applyPendingRecoveryDraft,
        pendingRecoveryDraft: buildPendingDraft(),
      })
    );

    await act(async () => {
      customRender(<Recepcion />);
    });

    expect(screen.getByText('Recuperar recepción pendiente')).toBeTruthy();

    await act(async () => {
      screen.getByRole('button', { name: 'Sí, recuperar' }).click();
    });

    expect(applyPendingRecoveryDraft).toHaveBeenCalledTimes(1);
  });
});
