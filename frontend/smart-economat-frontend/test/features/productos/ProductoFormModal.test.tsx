import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import ProductoFormModal from '../../../src/features/productos/ProductoFormModal';
import { fetchProveedores } from '../../../src/services/proveedor.service';

const dynamicFormSpy = vi.hoisted(() => ({
  props: null as null | Record<string, unknown>,
}));

vi.mock('../../../src/components/ui/DynamicFormModal', () => ({
  default: (props: Record<string, unknown>) => {
    dynamicFormSpy.props = props;
    return <div>dynamic-form-modal</div>;
  },
}));

vi.mock('../../../src/services/proveedor.service', () => ({
  fetchProveedores: vi.fn(),
}));

vi.mock('../../../src/services/openfoodfacts.service', () => ({
  searchByBarcode: vi.fn(),
  searchByName: vi.fn(),
}));

vi.mock('../../../src/services/producto.service', () => ({
  generateProductoEan13: vi.fn(),
}));

vi.mock('../../../src/store/auth.hooks', () => ({
  usePermission: () => true,
}));

vi.mock('../../../src/store/toast.hooks', () => ({
  useToast: () => ({
    error: vi.fn(),
  }),
}));

describe('ProductoFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dynamicFormSpy.props = null;
  });

  it('carga todas las páginas de proveedores para evitar recortes por límite fijo', async () => {
    vi.mocked(fetchProveedores)
      .mockResolvedValueOnce({
        data: [{ id: 'prov-1', nombre: 'Proveedor 1' }],
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        data: [{ id: 'prov-2', nombre: 'Proveedor 2' }],
        total: 2,
        page: 2,
        limit: 50,
        totalPages: 2,
      });

    render(
      <ProductoFormModal
        isOpen={true}
        onClose={vi.fn()}
        initialData={{}}
        onSubmit={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(fetchProveedores).toHaveBeenCalledTimes(2);
    });

    const fields = (dynamicFormSpy.props?.fields as Array<{
      name: string;
      options?: Array<{ value: string; label: string }>;
    }>) ?? [
      {
        name: '',
      },
    ];

    const proveedoresField = fields.find(
      (field) => field.name === 'proveedores'
    );

    expect(proveedoresField?.options).toHaveLength(2);
    expect(proveedoresField?.options?.map((opt) => opt.value)).toEqual([
      'prov-1',
      'prov-2',
    ]);
  });
});
