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

    await act(async () => {
      await result.current.flushSave(mockDraft.payload);
    });

    expect(pedidoDraftService.upsertPedidoDraft).toHaveBeenCalled();
  });

  it('debería limpiar el borrador al descartar', async () => {
    vi.mocked(pedidoDraftService.deletePedidoDraft).mockResolvedValue(
      undefined
    );

    const { result } = renderHook(() => usePedidoDraft());

    await act(async () => {
      await result.current.discardDraft();
    });

    expect(result.current.draft).toBeNull();
    expect(pedidoDraftService.deletePedidoDraft).toHaveBeenCalled();
  });

  describe('discardDraft - rollback en error', () => {
    it('debe restaurar el draft si el servidor falla al eliminar', async () => {
      vi.mocked(pedidoDraftService.fetchLatestPedidoDraft).mockResolvedValue(
        mockDraft
      );
      vi.mocked(pedidoDraftService.deletePedidoDraft).mockRejectedValue(
        new Error('Server error')
      );

      const { result } = renderHook(() => usePedidoDraft());

      await act(async () => {
        await result.current.loadDraft();
      });
      expect(result.current.draft).toEqual(mockDraft);

      await act(async () => {
        await result.current.discardDraft().catch(() => undefined);
      });

      expect(result.current.draft).toEqual(mockDraft);
    });

    it('debe propagar el error para que el componente pueda notificar', async () => {
      vi.mocked(pedidoDraftService.deletePedidoDraft).mockRejectedValue(
        new Error('Network failure')
      );

      const { result } = renderHook(() => usePedidoDraft());

      await expect(
        act(async () => {
          await result.current.discardDraft();
        })
      ).rejects.toThrow('Network failure');
    });

    it('si el servidor responde OK: draft debe quedar a null', async () => {
      vi.mocked(pedidoDraftService.fetchLatestPedidoDraft).mockResolvedValue(
        mockDraft
      );
      vi.mocked(pedidoDraftService.deletePedidoDraft).mockResolvedValue(
        undefined
      );

      const { result } = renderHook(() => usePedidoDraft());

      await act(async () => {
        await result.current.loadDraft();
      });

      await act(async () => {
        await result.current.discardDraft();
      });

      expect(result.current.draft).toBeNull();
    });

    it('REGRESIÓN: error de servidor no debe dejar estado inconsistente', async () => {
      vi.mocked(pedidoDraftService.fetchLatestPedidoDraft).mockResolvedValue(
        mockDraft
      );
      vi.mocked(pedidoDraftService.deletePedidoDraft).mockRejectedValue(
        new Error('500 Internal Server Error')
      );

      const { result } = renderHook(() => usePedidoDraft());

      await act(async () => {
        await result.current.loadDraft();
      });
      const draftAntes = result.current.draft;

      await act(async () => {
        await result.current.discardDraft().catch(() => undefined);
      });

      // El draft debe ser exactamente el mismo de antes (rollback correcto)
      expect(result.current.draft).toEqual(draftAntes);
      expect(result.current.draft).not.toBeNull();
    });
  });

  describe('saveDraft - notificación de errores', () => {
    it('saveError debe ser null inicialmente', () => {
      const { result } = renderHook(() => usePedidoDraft());
      expect(result.current.saveError).toBeNull();
    });

    it('saveError debe contener error cuando autosave falla', async () => {
      vi.mocked(pedidoDraftService.upsertPedidoDraft).mockRejectedValue(
        new Error('Autosave failed')
      );

      const { result } = renderHook(() => usePedidoDraft());

      await act(async () => {
        await result.current.flushSave({ lineas: [] });
      });

      expect(result.current.saveError).toBeInstanceOf(Error);
      expect(result.current.saveError?.message).toBe(
        'Error al guardar borrador automáticamente'
      );
    });
  });
});
