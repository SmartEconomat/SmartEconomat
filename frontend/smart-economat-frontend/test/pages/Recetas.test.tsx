import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Recetas from '../../src/pages/Recetas';
import * as recetaService from '../../src/services/receta.service';
import * as authHooks from '../../src/store/auth.hooks';
import * as pedidoService from '../../src/services/pedido.service';
import * as toastHooks from '../../src/store/toast.hooks';
import { DificultadReceta } from '../../src/services/receta.types';

const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());
const toastWarning = vi.hoisted(() => vi.fn());
const toastInfo = vi.hoisted(() => vi.fn());

vi.mock('../../src/services/receta.service');
vi.mock('../../src/store/auth.hooks');
vi.mock('../../src/store/toast.hooks', () => ({
  useToast: vi.fn(() => ({
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
    info: toastInfo,
  })),
}));
vi.mock('../../src/components/ui/RecipeCarousel', () => ({
  default: () => null,
}));
vi.mock('../../src/components/ui/ConfirmDialog', () => ({
  default: () => null,
}));
vi.mock('../../src/components/ui/DynamicFormModal', () => ({
  default: () => null,
}));
vi.mock('../../src/components/ui/DetailModal', () => ({
  default: () => null,
}));
vi.mock('../../src/components/ui/RecetaAlergenos', () => ({
  default: () => null,
}));
vi.mock('../../src/components/ui/StatusChip', () => ({
  default: ({ status }: { status: string }) => <span>{status}</span>,
}));
vi.mock('../../src/services/api.service', () => ({
  deleteResource: vi.fn(),
  resolveStoredFileUrl: (value: string) => value,
  uploadFile: vi.fn(),
}));
vi.mock('../../src/services/produccion.service', () => ({
  ejecutarProduccion: vi.fn(),
  validarStock: vi.fn().mockResolvedValue({ ingredients: [] }),
}));
vi.mock('../../src/services/pedido.service', () => ({
  createPedido: vi.fn(),
  createPedidoFromRecetas: vi.fn(),
  createPedidoUsuarioFromRecetas: vi.fn(),
}));
vi.mock('../../src/services/ubicacion.service', () => ({
  UbicacionService: {
    findAll: vi.fn().mockResolvedValue([{ id: 'ubi-1', nombre: 'Cocina' }]),
  },
}));
vi.mock('../../src/components/ui/DataTable', () => ({
  default: ({
    data,
    onSelectionChange,
  }: {
    data: { id: string; nombre: string }[];
    onSelectionChange?: (ids: string[]) => void;
  }) => (
    <div>
      <button onClick={() => onSelectionChange?.(data.map((item) => item.id))}>
        seleccionar recetas
      </button>
      {data.map((item) => (
        <div key={item.id}>{item.nombre}</div>
      ))}
    </div>
  ),
}));

const recetasMock = [
  {
    id: 'receta-1',
    nombre: 'Arroz',
    instrucciones: 'Cocer',
    tiempoEstimadoMinutos: 20,
    dificultad: DificultadReceta.FACIL,
    ingredientes: [],
    rendimiento: 10,
    raciones: 5,
    tamanioRacion: 2,
  },
  {
    id: 'receta-2',
    nombre: 'Pasta',
    instrucciones: 'Hervir',
    tiempoEstimadoMinutos: 15,
    dificultad: DificultadReceta.MEDIA,
    ingredientes: [],
    rendimiento: 8,
    raciones: 4,
    tamanioRacion: 2,
  },
];

describe('Recetas toolbar batch actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(authHooks.usePermission).mockReturnValue(true);
    vi.mocked(toastHooks.useToast).mockReturnValue({
      success: toastSuccess,
      error: toastError,
      warning: toastWarning,
      info: toastInfo,
    });
    vi.mocked(recetaService.fetchRecetas).mockResolvedValue({
      data: recetasMock,
      total: 2,
      totalPages: 1,
      page: 1,
      limit: 10,
    });
    vi.mocked(pedidoService.createPedidoUsuarioFromRecetas).mockResolvedValue({
      id: 'pedido-usuario-1',
      numeroGlobal: '42',
    } as never);
  });

  it('shows batch prepare next to PDF export and updates both after selection', async () => {
    render(<Recetas />);

    await waitFor(() => {
      expect(screen.getByText('Arroz')).toBeInTheDocument();
    });

    const prepareButton = screen.getByRole('button', {
      name: /preparar recetas/i,
    });
    const exportButton = screen.getByRole('button', {
      name: /exportar pdf/i,
    });

    expect(prepareButton).toBeInTheDocument();
    expect(exportButton).toBeInTheDocument();
    expect(prepareButton).toBeDisabled();
    expect(exportButton).toBeDisabled();
    expect(
      Boolean(
        prepareButton.compareDocumentPosition(exportButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
      )
    ).toBe(true);

    fireEvent.click(
      screen.getAllByRole('button', { name: /seleccionar recetas/i })[0]
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /preparar \(2\)/i })
      ).toBeEnabled();
    });

    expect(
      screen.getByRole('button', { name: /exportar pdf \(2\)/i })
    ).toBeEnabled();
  });

  it('creates an order from selected recipes without requiring missing ingredients', async () => {
    render(<Recetas />);

    await waitFor(() => {
      expect(screen.getByText('Arroz')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getAllByRole('button', { name: /seleccionar recetas/i })[0]
    );

    const createOrderButton = await screen.findByRole('button', {
      name: /crear pedido \(2\)/i,
    });

    fireEvent.click(createOrderButton);

    await waitFor(() => {
      expect(pedidoService.createPedidoUsuarioFromRecetas).toHaveBeenCalledWith(
        {
          recetaIds: ['receta-1', 'receta-2'],
          observaciones: 'Pedido generado desde recetas: Arroz, Pasta',
        }
      );
    });

    expect(toastSuccess).toHaveBeenCalledWith(
      'Pedido #42 generado correctamente desde 2 recetas.'
    );
  });
});
