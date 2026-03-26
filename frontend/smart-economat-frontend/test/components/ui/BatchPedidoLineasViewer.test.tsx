import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import BatchPedidoLineasViewer from '../../../src/components/ui/BatchPedidoLineasViewer';
import {
  EstadoPedido,
  PurchaseBatch,
} from '../../../src/services/pedido.types';
import * as apiService from '../../../src/services/api.service';

vi.mock('../../../src/services/api.service');
vi.mock('../../../src/store/toast.hooks', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe('BatchPedidoLineasViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiService.downloadFile).mockResolvedValue(undefined);
  });

  const mockBatch = {
    id: 'batch-1',
    observaciones: 'Lote de prueba',
    pedidos: [
      {
        id: 'ped-1',
        estado: EstadoPedido.PENDIENTE,
        costeTotal: 100,
        proveedor: { nombre: 'Proveedor A' },
        pedidoProductos: [
          {
            id: 'pp-1',
            cantidad: 10,
            precioUnitario: 10,
            productoProveedor: { producto: { nombre: 'Producto A' } },
          },
        ],
      },
      {
        id: 'ped-2',
        estado: EstadoPedido.CANCELADO,
        costeTotal: 50,
        proveedor: { nombre: 'Proveedor B' },
        pedidoProductos: [],
      },
    ],
  };

  it('debería renderizar la información del lote y pedidos', () => {
    render(
      <BatchPedidoLineasViewer batch={mockBatch as unknown as PurchaseBatch} />
    );

    expect(screen.getByText('Lote de prueba')).toBeDefined();
    expect(screen.getByText('Proveedor A')).toBeDefined();
    expect(screen.getByText('TOTAL COMPRA: 150.00 €')).toBeDefined();
  });

  it('debería filtrar pedidos cancelados al desmarcar el checkbox', () => {
    render(
      <BatchPedidoLineasViewer batch={mockBatch as unknown as PurchaseBatch} />
    );

    // Por defecto están incluidos. Total 150.
    expect(screen.getByText('TOTAL COMPRA: 150.00 €')).toBeDefined();

    const checkbox = screen.getByLabelText('Incluir cancelados');
    fireEvent.click(checkbox);

    // Ahora excluidos. Solo queda ped-1 (100).
    expect(screen.getByText('TOTAL COMPRA: 100.00 €')).toBeDefined();
    expect(screen.queryByText('Proveedor B')).toBeNull();
  });

  it('debería llamar a downloadFile al pulsar el icono de PDF', async () => {
    render(
      <BatchPedidoLineasViewer batch={mockBatch as unknown as PurchaseBatch} />
    );

    const pdfButton = screen.getByTestId('PictureAsPdfIcon').parentElement!;

    await act(async () => {
      fireEvent.click(pdfButton);
    });

    await waitFor(() => {
      expect(apiService.downloadFile).toHaveBeenCalledWith(
        expect.stringContaining('/purchase-batches/batch-1/pdf'),
        'reporte-lote-batch-1.pdf'
      );
    });
  });
});
