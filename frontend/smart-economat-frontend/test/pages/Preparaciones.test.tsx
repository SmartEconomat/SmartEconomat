import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Preparaciones from '../../src/pages/Preparaciones';
import * as produccionService from '../../src/services/produccion.service';
import {
  DificultadReceta,
  UnidadIngrediente,
} from '../../src/services/receta.types';
import * as toastHooks from '../../src/store/toast.hooks';

const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());
const toastWarning = vi.hoisted(() => vi.fn());
const toastInfo = vi.hoisted(() => vi.fn());

vi.mock('../../src/services/produccion.service');
vi.mock('../../src/store/toast.hooks', () => ({
  useToast: vi.fn(() => ({
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
    info: toastInfo,
  })),
}));
vi.mock('../../src/components/ui/PageToolbar', () => ({
  default: () => null,
}));
vi.mock('../../src/components/ui/DetailModal', () => ({
  default: ({
    isOpen,
    title,
    sections,
  }: {
    isOpen?: boolean;
    title?: React.ReactNode;
    sections?: Array<{
      title?: React.ReactNode;
      fields?: Array<{ label: React.ReactNode; value: React.ReactNode }>;
    }>;
  }) =>
    isOpen ? (
      <div>
        <div>{title}</div>
        {sections?.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <div>{section.title}</div>
            {section.fields?.map((field, fieldIndex) => (
              <div key={fieldIndex}>
                <span>{field.label}</span>
                <span>{field.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    ) : null,
}));
vi.mock('../../src/components/ui/DataTable', () => ({
  default: ({
    columns,
    data,
    renderActions,
  }: {
    columns: Array<{
      id: string;
      label: React.ReactNode;
      render?: (row: Record<string, unknown>) => React.ReactNode;
    }>;
    data: Array<Record<string, unknown>>;
    renderActions?: (row: Record<string, unknown>) => React.ReactNode;
  }) => (
    <div>
      {columns.map((column) => (
        <div key={String(column.id)}>{column.label}</div>
      ))}
      {data.map((row, rowIndex) => (
        <div key={String(row.id ?? rowIndex)}>
          {columns.map((column) => (
            <div
              key={String(column.id)}
              data-testid={`cell-${rowIndex}-${String(column.id)}`}
            >
              {column.render
                ? column.render(row)
                : String(row[column.id as keyof typeof row] ?? '')}
            </div>
          ))}
          <div>{renderActions?.(row)}</div>
        </div>
      ))}
    </div>
  ),
}));

const produccionesMock: produccionService.ProduccionLote[] = [
  {
    id: 'lote-1',
    recetaId: 'receta-1',
    usuarioId: 'usuario-1',
    cantidadProducida: 12,
    fechaProduccion: '2025-01-01T10:00:00.000Z',
    costeTotalReal: 22.5,
    porcionesProducidas: 9.341,
    porcionesRestantes: 8.741,
    estado: 'disponible',
  },
  {
    id: 'lote-2',
    recetaId: 'receta-2',
    usuarioId: 'usuario-2',
    cantidadProducida: 40,
    fechaProduccion: '2025-01-02T10:00:00.000Z',
    costeTotalReal: 48.25,
    porcionesProducidas: 128,
    porcionesRestantes: 118.2,
    estado: 'disponible',
  },
  {
    id: 'lote-3',
    recetaId: 'receta-3',
    usuarioId: 'usuario-3',
    cantidadProducida: 2,
    fechaProduccion: '2025-01-03T10:00:00.000Z',
    costeTotalReal: 6.4,
    porcionesProducidas: 1,
    porcionesRestantes: 0.64,
    estado: 'disponible',
  },
];

describe('Preparaciones page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(toastHooks.useToast).mockReturnValue({
      success: toastSuccess,
      error: toastError,
      warning: toastWarning,
      info: toastInfo,
    });
    vi.mocked(produccionService.fetchProducciones).mockResolvedValue({
      data: produccionesMock,
      total: produccionesMock.length,
      totalPages: 1,
      page: 1,
      limit: 10,
    });
    vi.mocked(produccionService.consumirPorciones).mockResolvedValue(
      produccionesMock[0]
    );
  });

  it('muestra una sola cifra de raciones disponibles con redondeo legible', async () => {
    render(<Preparaciones />);

    await waitFor(() => {
      expect(produccionService.fetchProducciones).toHaveBeenCalledWith(
        1,
        10,
        'sin_consumo'
      );
    });

    expect(screen.getByText('Raciones disponibles')).toBeInTheDocument();

    const firstCell = await screen.findByTestId('cell-0-porcionesRestantes');
    const secondCell = screen.getByTestId('cell-1-porcionesRestantes');
    const thirdCell = screen.getByTestId('cell-2-porcionesRestantes');

    expect(firstCell).toHaveTextContent('8,5');
    expect(firstCell).not.toHaveTextContent('/');

    expect(secondCell).toHaveTextContent('118');
    expect(secondCell).not.toHaveTextContent('/');

    expect(thirdCell).toHaveTextContent('0,5');
    expect(thirdCell).not.toHaveTextContent('/');
  });

  it('muestra el consumo en pasos de media racion', async () => {
    vi.mocked(produccionService.fetchProducciones).mockResolvedValueOnce({
      data: [
        {
          ...produccionesMock[0],
          porcionesProducidas: 9,
          porcionesRestantes: 9,
        },
      ],
      total: 1,
      totalPages: 1,
      page: 1,
      limit: 10,
    });

    render(<Preparaciones />);

    const consumeButton = await screen.findAllByRole('button', {
      name: /consumir preparación/i,
    });

    fireEvent.click(consumeButton[0]);

    expect(screen.getByText('Disponibles: 9 raciones')).toBeInTheDocument();
    expect(
      screen.getByText('Máximo disponible: 9 raciones.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/de 9,3 raciones/i)).not.toBeInTheDocument();
  });

  it('bloquea el consumo por cantidad cuando no es multiplo del tamano de racion', async () => {
    vi.mocked(produccionService.fetchProducciones).mockResolvedValueOnce({
      data: [
        {
          ...produccionesMock[0],
          porcionesProducidas: 9,
          porcionesRestantes: 9,
          receta: {
            id: 'receta-1',
            nombre: 'Pan',
            instrucciones: 'Hornear',
            tiempoEstimadoMinutos: 30,
            dificultad: DificultadReceta.FACIL,
            tamanioRacion: 0.5,
            unidadResultado: UnidadIngrediente.KILOGRAMO,
          },
        },
      ],
      total: 1,
      totalPages: 1,
      page: 1,
      limit: 10,
    });

    render(<Preparaciones />);

    const consumeButton = await screen.findAllByRole('button', {
      name: /consumir preparación/i,
    });

    fireEvent.click(consumeButton[0]);
    fireEvent.click(
      screen.getByRole('button', { name: /por cantidad\/peso/i })
    );

    const amountInput = screen.getByLabelText(/cantidad a consumir/i);
    fireEvent.change(amountInput, { target: { value: '1,2' } });

    expect(
      screen.getByText('Debe ser múltiplo de 0,25 kg.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /confirmar consumo/i })
    ).toBeDisabled();
  });

  it('permite consumir la cantidad maxima disponible cuando cae en pasos de media racion', async () => {
    vi.mocked(produccionService.fetchProducciones).mockResolvedValueOnce({
      data: [
        {
          ...produccionesMock[0],
          porcionesProducidas: 8.5,
          porcionesRestantes: 8.5,
          receta: {
            id: 'receta-1',
            nombre: 'Salsa',
            instrucciones: 'Mezclar',
            tiempoEstimadoMinutos: 30,
            dificultad: DificultadReceta.FACIL,
            tamanioRacion: 0.17,
            unidadResultado: UnidadIngrediente.KILOGRAMO,
          },
        },
      ],
      total: 1,
      totalPages: 1,
      page: 1,
      limit: 10,
    });

    render(<Preparaciones />);

    const consumeButton = await screen.findAllByRole('button', {
      name: /consumir preparación/i,
    });

    fireEvent.click(consumeButton[0]);
    fireEvent.click(
      screen.getByRole('button', { name: /por cantidad\/peso/i })
    );

    const amountInput = screen.getByLabelText(/cantidad a consumir/i);
    fireEvent.change(amountInput, { target: { value: '1,445' } });

    expect(screen.queryByText(/Debe ser múltiplo de/i)).not.toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /confirmar consumo/i })
    ).not.toBeDisabled();
  });

  it('permite consumir por cantidad cuando la cantidad es multiplo exacto del tamano de racion', async () => {
    vi.mocked(produccionService.fetchProducciones).mockResolvedValueOnce({
      data: [
        {
          ...produccionesMock[0],
          porcionesProducidas: 9,
          porcionesRestantes: 9,
          receta: {
            id: 'receta-1',
            nombre: 'Pan',
            instrucciones: 'Hornear',
            tiempoEstimadoMinutos: 30,
            dificultad: DificultadReceta.FACIL,
            tamanioRacion: 0.5,
            unidadResultado: UnidadIngrediente.KILOGRAMO,
          },
        },
      ],
      total: 1,
      totalPages: 1,
      page: 1,
      limit: 10,
    });

    render(<Preparaciones />);

    const consumeButton = await screen.findAllByRole('button', {
      name: /consumir preparación/i,
    });

    fireEvent.click(consumeButton[0]);
    fireEvent.click(
      screen.getByRole('button', { name: /por cantidad\/peso/i })
    );

    const amountInput = screen.getByLabelText(/cantidad a consumir/i);
    fireEvent.change(amountInput, { target: { value: '1,5' } });

    const confirmButton = screen.getByRole('button', {
      name: /confirmar consumo/i,
    });

    expect(confirmButton).not.toBeDisabled();

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(produccionService.consumirPorciones).toHaveBeenCalledWith(
        'lote-1',
        {
          tipo: 'cantidad',
          valor: 1.5,
        }
      );
    });
  });

  it('no muestra la accion de consumir en la pestaña agotadas', async () => {
    vi.mocked(produccionService.fetchProducciones)
      .mockResolvedValueOnce({
        data: [
          {
            ...produccionesMock[0],
            receta: {
              id: 'receta-1',
              nombre: 'Pan',
              instrucciones: 'Hornear',
              tiempoEstimadoMinutos: 30,
              dificultad: DificultadReceta.FACIL,
              tamanioRacion: 0.17,
              unidadResultado: UnidadIngrediente.KILOGRAMO,
            },
          },
        ],
        total: 1,
        totalPages: 1,
        page: 1,
        limit: 10,
      })
      .mockResolvedValueOnce({
        data: [
          {
            ...produccionesMock[0],
            porcionesProducidas: 10,
            porcionesRestantes: 8.5,
            receta: {
              id: 'receta-1',
              nombre: 'Pan',
              instrucciones: 'Hornear',
              tiempoEstimadoMinutos: 30,
              dificultad: DificultadReceta.FACIL,
              tamanioRacion: 0.17,
              unidadResultado: UnidadIngrediente.KILOGRAMO,
            },
          },
        ],
        total: 1,
        totalPages: 1,
        page: 1,
        limit: 10,
      });

    render(<Preparaciones />);

    fireEvent.click(screen.getByRole('tab', { name: /agotadas/i }));

    await waitFor(() => {
      expect(produccionService.fetchProducciones).toHaveBeenLastCalledWith(
        1,
        10,
        'consumido'
      );
    });

    expect(
      screen.queryByRole('button', { name: /consumir preparación/i })
    ).not.toBeInTheDocument();
  });

  it('no muestra raciones disponibles en el detalle de agotadas', async () => {
    vi.mocked(produccionService.fetchProducciones)
      .mockResolvedValueOnce({
        data: [
          {
            ...produccionesMock[0],
            receta: {
              id: 'receta-1',
              nombre: 'Pan',
              instrucciones: 'Hornear',
              tiempoEstimadoMinutos: 30,
              dificultad: DificultadReceta.FACIL,
              tamanioRacion: 0.17,
              unidadResultado: UnidadIngrediente.KILOGRAMO,
            },
          },
        ],
        total: 1,
        totalPages: 1,
        page: 1,
        limit: 10,
      })
      .mockResolvedValueOnce({
        data: [
          {
            ...produccionesMock[0],
            porcionesProducidas: 10,
            porcionesRestantes: 0,
            estado: 'agotado',
            receta: {
              id: 'receta-1',
              nombre: 'Pan',
              instrucciones: 'Hornear',
              tiempoEstimadoMinutos: 30,
              dificultad: DificultadReceta.FACIL,
              tamanioRacion: 0.17,
              unidadResultado: UnidadIngrediente.KILOGRAMO,
            },
          },
        ],
        total: 1,
        totalPages: 1,
        page: 1,
        limit: 10,
      });

    render(<Preparaciones />);

    fireEvent.click(screen.getByRole('tab', { name: /agotadas/i }));

    await waitFor(() => {
      expect(produccionService.fetchProducciones).toHaveBeenLastCalledWith(
        1,
        10,
        'consumido'
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /ver detalles/i }));

    expect(screen.queryByText('Raciones disponibles')).not.toBeInTheDocument();
    expect(screen.getAllByText('Raciones preparadas').length).toBeGreaterThan(
      0
    );
  });
});
