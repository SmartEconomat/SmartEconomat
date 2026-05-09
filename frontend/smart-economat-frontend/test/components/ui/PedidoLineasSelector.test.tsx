import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PedidoLineasSelector from '../../../src/components/ui/PedidoLineasSelector';
import type { PedidoProducto } from '../../../src/services/pedido.types';
import type { ProductoProveedorOption } from '../../../src/services/productoProveedor.service';
import * as productoProveedorService from '../../../src/services/productoProveedor.service';

vi.mock('../../../src/services/productoProveedor.service', () => ({
  searchProductoProveedor: vi.fn(),
}));

type PedidoLineaEditable = Partial<PedidoProducto> & {
  productoId?: string;
  proveedorId?: string;
  nombreProducto?: string;
  nombreProveedor?: string;
};

const buildOption = (
  overrides: Partial<ProductoProveedorOption>
): ProductoProveedorOption => ({
  id: 'pp-base-1',
  productoNombre: 'Producto Base',
  productoId: 'prod-base-1',
  unidad: 'unidad',
  contenido: 1,
  proveedorNombre: 'Proveedor Base',
  proveedorId: 'prov-base-1',
  marca: 'Marca Base',
  codigoBarras: '0000000000000',
  precioUnitario: 1.5,
  label: 'Producto Base (Proveedor Base)',
  ...overrides,
});

describe('PedidoLineasSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(
      productoProveedorService.searchProductoProveedor
    ).mockResolvedValue([
      buildOption({
        id: 'pp-leche-1',
        productoNombre: 'Leche Entera',
        productoId: 'prod-leche-1',
        proveedorNombre: 'Proveedor Norte',
        proveedorId: 'prov-norte',
        precioUnitario: 1.25,
      }),
    ]);
  });

  it('busca productos de forma reactiva y permite seleccionar resultados remotos por identificador', async () => {
    const defaultOptions = [
      buildOption({
        id: 'pp-harina-1',
        productoNombre: 'Harina de trigo',
        productoId: 'prod-harina-1',
        proveedorNombre: 'Proveedor Sur',
        proveedorId: 'prov-sur',
        precioUnitario: 0.99,
      }),
    ];

    const remoteOptions = [
      buildOption({
        id: 'pp-tomate-1',
        productoNombre: 'Tomate Triturado',
        productoId: 'prod-tomate-1',
        proveedorNombre: 'Proveedor Centro',
        proveedorId: 'prov-centro',
        codigoBarras: '9876543210123',
        precioUnitario: 2.45,
      }),
    ];

    vi.mocked(
      productoProveedorService.searchProductoProveedor
    ).mockImplementation(async (q) => {
      if (q.trim() === '9876543210123') {
        return remoteOptions;
      }

      return defaultOptions;
    });

    const onChange = vi.fn();
    render(
      <PedidoLineasSelector
        value={[
          {
            productoProveedorId: '',
            cantidad: 1,
            precioUnitario: 0,
          },
        ]}
        onChange={onChange}
      />
    );

    await waitFor(() => {
      expect(
        productoProveedorService.searchProductoProveedor
      ).toHaveBeenCalledWith('', 50, 0);
    });

    const dataRows = await screen.findAllByRole('row');
    const firstDataRow = dataRows[1];
    const productInput = within(firstDataRow).getAllByRole('combobox')[0];

    await userEvent.click(productInput);
    await userEvent.type(productInput, '9876543210123');

    await waitFor(
      () => {
        expect(
          productoProveedorService.searchProductoProveedor
        ).toHaveBeenCalledWith('9876543210123', 50, 0);
      },
      { timeout: 10000 }
    );

    const remoteOption = await screen.findByRole('option', {
      name: 'Tomate Triturado',
    });
    await userEvent.click(remoteOption);

    await waitFor(
      () => {
        const latestLines = onChange.mock.calls.at(-1)?.[0] as
          | PedidoLineaEditable[]
          | undefined;
        expect(latestLines?.[0]?.productoProveedorId).toBe('pp-tomate-1');
      },
      { timeout: 10000 }
    );
  }, 15000);

  it('permite editar manualmente el precio unitario', async () => {
    const onChange = vi.fn();
    const currentLines: PedidoLineaEditable[] = [
      {
        productoId: 'prod-leche-1',
        productoProveedorId: 'pp-leche-1',
        proveedorId: 'prov-norte',
        nombreProducto: 'Leche Entera',
        nombreProveedor: 'Proveedor Norte',
        cantidad: 2,
        precioUnitario: 1.25,
      },
    ];

    render(<PedidoLineasSelector value={currentLines} onChange={onChange} />);

    const dataRows = await screen.findAllByRole('row');
    const firstDataRow = dataRows[1];
    const textInputs = within(firstDataRow).getAllByRole('textbox');
    const unitPriceInput = textInputs[2];

    expect(unitPriceInput).not.toHaveAttribute('readonly');

    fireEvent.change(unitPriceInput, { target: { value: '2.75' } });

    await waitFor(() => {
      const latestLines = onChange.mock.calls.at(-1)?.[0] as
        | PedidoLineaEditable[]
        | undefined;
      expect(latestLines?.[0]?.precioUnitario).toBe(2.75);
    });
  });
});
