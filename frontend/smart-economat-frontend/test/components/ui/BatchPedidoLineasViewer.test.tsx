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
  EstadoPedidoUsuario,
  PedidoUsuario,
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
        fechaPedido: '2026-04-01T10:00:00.000Z',
        estado: EstadoPedido.PENDIENTE_DE_APROBACION,
        costeTotal: 100,
        proveedor: { id: 'prov-a', nombre: 'Proveedor A' },
        pedidoProductos: [
          {
            id: 'pp-1',
            productoProveedorId: 'pp-1',
            cantidad: 10,
            precioUnitario: 10,
            productoProveedor: {
              id: 'pp-1',
              precioUnitario: 10,
              producto: { id: 'prod-a', nombre: 'Producto A' },
              proveedor: { id: 'prov-a', nombre: 'Proveedor A' },
            },
          },
        ],
      },
      {
        id: 'ped-2',
        fechaPedido: '2026-04-01T10:00:00.000Z',
        estado: EstadoPedido.CANCELADO,
        costeTotal: 50,
        proveedor: { id: 'prov-b', nombre: 'Proveedor B' },
        pedidoProductos: [],
      },
    ],
  };

  it('debería renderizar la información del lote y pedidos', () => {
    render(
      <BatchPedidoLineasViewer
        batch={mockBatch as unknown as PurchaseBatch}
        mode="batch"
      />
    );

    expect(screen.getByText('Lote de prueba')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Proveedor A' })).toBeDefined();
    expect(screen.getByText('TOTAL COMPRA: 150.00 €')).toBeDefined();
  });

  it('debería filtrar pedidos cancelados al desmarcar el checkbox', () => {
    render(
      <BatchPedidoLineasViewer
        batch={mockBatch as unknown as PurchaseBatch}
        mode="batch"
      />
    );

    // Por defecto están incluidos. Total 150.
    expect(screen.getByText('TOTAL COMPRA: 150.00 €')).toBeDefined();

    const checkbox = screen.getByLabelText('Incluir cancelados');
    fireEvent.click(checkbox);

    // Ahora excluidos. Solo queda ped-1 (100).
    expect(screen.getByText('TOTAL COMPRA: 100.00 €')).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'Proveedor B' })).toBeNull();
  });

  it('debería llamar a downloadFile al pulsar el icono de PDF', async () => {
    render(
      <BatchPedidoLineasViewer
        batch={mockBatch as unknown as PurchaseBatch}
        mode="batch"
      />
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

  it('usa el endpoint de pedido-usuario cuando el detalle visible se identifica como pedido_usuario', async () => {
    const pedidoVisible = {
      id: 'pedido-usuario-1',
      numeroGlobal: '42',
      fechaPedido: '2026-04-01T10:00:00.000Z',
      costeTotal: 100,
      estado: EstadoPedidoUsuario.PENDIENTE,
      pedidos: mockBatch.pedidos,
    } satisfies PedidoUsuario;

    render(<BatchPedidoLineasViewer batch={pedidoVisible} mode="pedido" />);

    expect(screen.getByText('TOTAL: 150.00 €')).toBeDefined();

    const pdfButton = screen.getByTestId('PictureAsPdfIcon').parentElement!;

    await act(async () => {
      fireEvent.click(pdfButton);
    });

    await waitFor(() => {
      expect(apiService.downloadFile).toHaveBeenCalledWith(
        expect.stringContaining('/pedido-usuarios/pedido-usuario-1/pdf'),
        'pedido-pedido-u.pdf'
      );
    });
  });
});
