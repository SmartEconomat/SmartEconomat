import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnidadIngrediente } from '../../../src/services/receta.types';
import type { Producto } from '../../../src/services/producto.types';
import * as productoService from '../../../src/services/producto.service';
import RecetaIngredientesSelector from '../../../src/components/ui/RecetaIngredientesSelector';

vi.mock('../../../src/services/producto.service', () => ({
  fetchProductos: vi.fn(),
  getProductoById: vi.fn(),
  searchProductosByName: vi.fn(),
}));

describe('RecetaIngredientesSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productoService.fetchProductos).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 1,
    });
    vi.mocked(productoService.searchProductosByName).mockResolvedValue([]);
    vi.mocked(productoService.getProductoById).mockResolvedValue(
      undefined as unknown as Producto
    );
  });

  it('no rompe al renderizar ingredientes con producto nulo', async () => {
    render(
      <RecetaIngredientesSelector
        value={[
          {
            productoId: 'producto-1',
            cantidad: 1,
            unidad: UnidadIngrediente.GRAMO,
            producto: null,
          },
        ]}
        onChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ingredientes de la Receta')).toBeTruthy();
    });

    expect(screen.getByPlaceholderText('Buscar producto...')).toBeTruthy();
  });
});
