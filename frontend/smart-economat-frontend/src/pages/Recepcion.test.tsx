import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Recepcion from './Recepcion';
import { serialService } from '../services/serial.service';

vi.mock('../services/serial.service', () => {
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
vi.mock('../hooks/useRecepcionDraft', () => ({
  useRecepcionDraft: () => ({
    clearDraft: vi.fn(),
    conflict: false,
    draft: { version: 2, pedidosSeleccionados: [], paso: 'SELECCION_PEDIDOS' },
    isReady: true,
    keepLocalDraft: vi.fn(),
    setDraft: vi.fn(),
    syncError: null,
    syncStatus: 'synced',
    useRemoteDraft: vi.fn(),
  }),
}));

vi.mock('../services/api.service', () => ({
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

vi.mock('../sherlock-auth/hooks', () => ({
  usePermission: vi.fn().mockReturnValue(true),
}));

describe('Recepcion component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', {});
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
});
