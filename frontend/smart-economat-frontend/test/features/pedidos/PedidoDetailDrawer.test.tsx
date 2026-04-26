import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import PedidoDetailDrawer from '../../../src/features/pedidos/components/PedidoDetailDrawer';
import { EstadoPedido, type Pedido } from '../../../src/services/pedido.types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../../src/store/toast.hooks', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn() }),
}));

vi.mock('../../../src/components/ui/DetailModal', () => ({
  __esModule: true,
  default: ({
    title,
    subtitle,
    actions,
    sections,
  }: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    sections?: Array<{ title?: string; content?: React.ReactNode }>;
  }) => (
    <div>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
      {sections?.map((section, index) => (
        <div key={index}>
          {section.title ? <h3>{section.title}</h3> : null}
          {section.content}
        </div>
      ))}
      {actions}
    </div>
  ),
}));

const pedidoBase = {
  id: 'ped-1',
  estado: EstadoPedido.PENDIENTE_DE_APROBACION,
  costeTotal: 12.5,
  fechaPedido: '2026-01-10T00:00:00.000Z',
  fechaEntrega: '2026-01-11T00:00:00.000Z',
  pedidoProductos: [],
  proveedor: { nombre: 'Prov A' },
  usuario: { username: 'demo' },
  observaciones: '',
} as unknown as Pedido;

describe('PedidoDetailDrawer', () => {
  it('renderiza etiquetas i18n de detalle', () => {
    render(
      <PedidoDetailDrawer
        pedido={pedidoBase}
        canEdit
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('pedidos.detalleTitulo')).toBeInTheDocument();
    expect(
      screen.getByText('pedidos.detalle.secciones.lineas')
    ).toBeInTheDocument();
    expect(
      screen.getByText('pedidos.detalle.acciones.descargarPdf')
    ).toBeInTheDocument();
  });
});
