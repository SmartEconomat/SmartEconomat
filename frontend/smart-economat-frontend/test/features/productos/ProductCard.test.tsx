import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProductCard from '../../../src/features/productos/ProductCard';
import { UnidadMedida } from '../../../src/services/producto.types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ProductCard actions', () => {
  const baseProducto = {
    id: 'prod-1',
    nombre: 'Leche Entera',
    contenido: 1,
    unidad: UnidadMedida.L,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    alergenos: [],
    proveedores: [],
  };

  it('no propaga click de editar al handler de ver detalle', () => {
    const onView = vi.fn();
    const onEdit = vi.fn();

    render(
      <ProductCard producto={baseProducto} onView={onView} onEdit={onEdit} />
    );

    fireEvent.click(screen.getByLabelText('productos.actions.editar'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onView).not.toHaveBeenCalled();
  });

  it('no propaga click de eliminar al handler de ver detalle', () => {
    const onView = vi.fn();
    const onDelete = vi.fn();

    render(
      <ProductCard
        producto={baseProducto}
        onView={onView}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByLabelText('productos.actions.eliminar'));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onView).not.toHaveBeenCalled();
  });
});
