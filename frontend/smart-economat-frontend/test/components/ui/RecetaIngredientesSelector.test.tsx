import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('muestra una sola ayuda global de búsqueda aunque existan varias filas', async () => {
    render(
      <RecetaIngredientesSelector
        value={[
          {
            productoId: '',
            cantidad: 1,
            unidad: UnidadIngrediente.GRAMO,
          },
          {
            productoId: '',
            cantidad: 2,
            unidad: UnidadIngrediente.GRAMO,
          },
        ]}
        onChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole('table', { name: 'Ingredientes de la Receta' })
      ).toBeInTheDocument();
    });

    expect(
      screen.getAllByText('Escribe al menos 2 letras para buscar productos.')
    ).toHaveLength(1);
    expect(screen.getAllByPlaceholderText('Buscar producto...')).toHaveLength(
      2
    );
  });

  describe('mermaAplicada', () => {
    const ingredienteBase = {
      productoId: 'prod-1',
      cantidad: 2,
      unidad: UnidadIngrediente.GRAMO,
      mermaAplicada: 10,
    };

    it('debe mostrar campo mermaAplicada editable por cada ingrediente', async () => {
      render(
        <RecetaIngredientesSelector
          value={[ingredienteBase]}
          onChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByRole('table', { name: 'Ingredientes de la Receta' })
        ).toBeInTheDocument();
      });

      const input = screen.getByRole('textbox', { name: 'merma-aplicada-0' });
      expect(input).toBeInTheDocument();
    });

    it('mermaAplicada por defecto debe ser 0 al añadir nueva fila', async () => {
      const onChange = vi.fn();

      render(<RecetaIngredientesSelector value={[]} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByText('Añadir Ingrediente')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Añadir Ingrediente'));

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ mermaAplicada: 0 })])
      );
    });

    it('mermaAplicada incluido en los datos devueltos al padre', async () => {
      const onChange = vi.fn();

      render(
        <RecetaIngredientesSelector
          value={[{ ...ingredienteBase, mermaAplicada: 5 }]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByRole('table', { name: 'Ingredientes de la Receta' })
        ).toBeInTheDocument();
      });

      const input = screen.getByRole('textbox', { name: 'merma-aplicada-0' });
      fireEvent.change(input, { target: { value: '20' } });

      const lastCall = onChange.mock.calls[
        onChange.mock.calls.length - 1
      ][0] as (typeof ingredienteBase)[];
      expect(lastCall[0]).toHaveProperty('mermaAplicada', 20);
    });

    it('mermaAplicada por defecto debe ser 0, no undefined ni null', async () => {
      const onChange = vi.fn();

      render(<RecetaIngredientesSelector value={[]} onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByText('Añadir Ingrediente')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Añadir Ingrediente'));

      const addedLine = (
        onChange.mock.calls[0][0] as (typeof ingredienteBase)[]
      )[0];
      expect(addedLine.mermaAplicada).toBeDefined();
      expect(addedLine.mermaAplicada).not.toBeNull();
      expect(addedLine.mermaAplicada).toBe(0);
    });

    it('REGRESIÓN: usuario puede cambiar mermaAplicada de un ingrediente', async () => {
      const onChange = vi.fn();

      render(
        <RecetaIngredientesSelector
          value={[{ ...ingredienteBase, mermaAplicada: 0 }]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByRole('table', { name: 'Ingredientes de la Receta' })
        ).toBeInTheDocument();
      });

      const input = screen.getByRole('textbox', { name: 'merma-aplicada-0' });
      fireEvent.change(input, { target: { value: '15' } });

      const lastCall = onChange.mock.calls[
        onChange.mock.calls.length - 1
      ][0] as (typeof ingredienteBase)[];
      expect(lastCall[0].mermaAplicada).toBe(15);
    });
  });
});
