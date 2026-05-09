import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import SummaryModal from '../../../src/components/ui/SummaryModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'resumen.verTodosFallback') {
        return `resumen.verTodosFallback:${String(params?.title ?? '')}`;
      }
      return key;
    },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../src/components/ui/Spinner', () => ({
  default: () => <div>spinner</div>,
}));

vi.mock('../../../src/services/producto.service', () => ({
  fetchProductos: vi.fn(),
}));
vi.mock('../../../src/services/pedido.service', () => ({
  fetchPedidos: vi.fn(),
}));
vi.mock('../../../src/services/proveedor.service', () => ({
  fetchProveedores: vi.fn(),
}));
vi.mock('../../../src/services/incidencia.service', () => ({
  fetchIncidencias: vi.fn(),
}));
vi.mock('../../../src/services/inventario.service', () => ({
  fetchAlertasStock: vi.fn(),
}));

import { fetchProductos } from '../../../src/services/producto.service';

describe('SummaryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchProductos).mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 1,
      page: 1,
      limit: 50,
    });
  });

  it('muestra estado vacío y CTA traducidos', async () => {
    render(
      <SummaryModal
        isOpen
        onClose={vi.fn()}
        type="productos"
        title="Productos"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('resumen.sinElementos')).toBeInTheDocument();
    });

    expect(fetchProductos).toHaveBeenCalledWith(
      1,
      50,
      '',
      [],
      'createdAt',
      'desc'
    );
  });
});
