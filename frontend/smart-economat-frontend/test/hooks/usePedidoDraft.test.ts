import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePedidoDraft } from '../../src/hooks/usePedidoDraft';
import * as pedidoDraftService from '../../src/services/pedidoDraft.service';

vi.mock('../../src/services/pedidoDraft.service');

describe('usePedidoDraft', () => {
  const mockDraft = {
    id: 'draft-1',
    userId: 'user-1',
    version: 1,
    payload: {
      observaciones: 'Draft test',
      lineas: [{ productoProveedorId: 'pp-1', cantidad: 5 }],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: null,
    source: 'redis' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería cargar el borrador inicial al montar', async () => {
    vi.mocked(pedidoDraftService.fetchLatestPedidoDraft).mockResolvedValue(
      mockDraft
    );

    const { result } = renderHook(() => usePedidoDraft());

    await act(async () => {
      await result.current.loadDraft();
    });

    expect(result.current.draft).toEqual(mockDraft);
    expect(pedidoDraftService.fetchLatestPedidoDraft).toHaveBeenCalled();
  });

  it('debería actualizar el borrador localmente y disparar el guardado', async () => {
    vi.mocked(pedidoDraftService.upsertPedidoDraft).mockResolvedValue({
      ...mockDraft,
      version: 2,
    });

    const { result } = renderHook(() => usePedidoDraft());

    await act(async () => {
      await result.current.saveDraft(mockDraft.payload);
    });

    // Nota: saveDraft tiene un debounce de 1s en la implementación real si no se dispara el flush
    // Pero como estamos en test con mocks timer, o podemos llamar a flushSave
    await act(async () => {
      await result.current.flushSave(mockDraft.payload);
    });

    expect(pedidoDraftService.upsertPedidoDraft).toHaveBeenCalled();
  });

  it('debería limpiar el borrador al descartar', async () => {
    const { result } = renderHook(() => usePedidoDraft());

    await act(async () => {
      await result.current.discardDraft();
    });

    expect(result.current.draft).toBeNull();
    expect(pedidoDraftService.deletePedidoDraft).toHaveBeenCalled();
  });
});
