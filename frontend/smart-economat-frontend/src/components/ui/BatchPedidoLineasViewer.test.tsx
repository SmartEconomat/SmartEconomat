import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BatchPedidoLineasViewer from './BatchPedidoLineasViewer';
import { EstadoPedido, PurchaseBatch } from '../../services/pedido.types';
import * as apiService from '../../services/api.service';

vi.mock('../../services/api.service');
vi.mock('../../store/toast.hooks', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe('BatchPedidoLineasViewer', () => {
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
    expect(screen.getByText('TOTAL LOTE DE COMPRA: 150.00 €')).toBeDefined();
  });

  it('debería filtrar pedidos cancelados al desmarcar el checkbox', () => {
    render(
      <BatchPedidoLineasViewer batch={mockBatch as unknown as PurchaseBatch} />
    );

    // Por defecto están incluidos. Total 150.
    expect(screen.getByText('TOTAL LOTE DE COMPRA: 150.00 €')).toBeDefined();

    const checkbox = screen.getByLabelText('Incluir cancelados');
    fireEvent.click(checkbox);

    // Ahora excluidos. Solo queda ped-1 (100).
    expect(screen.getByText('TOTAL LOTE DE COMPRA: 100.00 €')).toBeDefined();
    expect(screen.queryByText('Proveedor B')).toBeNull();
  });

  it('debería llamar a downloadFile al pulsar el icono de PDF', async () => {
    render(
      <BatchPedidoLineasViewer batch={mockBatch as unknown as PurchaseBatch} />
    );

    const pdfButton = screen.getByTestId('PictureAsPdfIcon').parentElement!;
    fireEvent.click(pdfButton);

    expect(apiService.downloadFile).toHaveBeenCalledWith(
      expect.stringContaining('/purchase-batches/batch-1/pdf'),
      expect.stringContaining('reporte-lote-batch-1')
    );
  });
});
