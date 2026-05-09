import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RecetaToPedidoService } from '../../../src/modules/pedido/service/receta-to-pedido.service';

describe('RecetaToPedidoService', () => {
  const mockRecetaRepository = {
    findById: jest.fn<(id: string) => Promise<any>>(),
  };

  const mockPedidoService = {
    create: jest.fn<(dto: any, userId: string) => Promise<any>>(),
  };

  const mockProductoProveedorRepository = {
    find: jest.fn<(query: any) => Promise<any[]>>(),
  };

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue(mockProductoProveedorRepository),
  };

  let service: RecetaToPedidoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecetaToPedidoService(
      mockRecetaRepository as any,
      mockPedidoService as any,
      mockDataSource as any
    );
  });

  it('consolida ingredientes repetidos y crea un único pedido', async () => {
    mockRecetaRepository.findById
      .mockResolvedValueOnce({
        id: 'receta-1',
        nombre: 'Receta A',
        ingredientes: [
          {
            productoId: 'prod-1',
            cantidad: 2,
            mermaAplicada: 0,
            unidad: 'KILOGRAMO',
            producto: { id: 'prod-1', nombre: 'Harina', deletedAt: null },
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 'receta-2',
        nombre: 'Receta B',
        ingredientes: [
          {
            productoId: 'prod-1',
            cantidad: 1,
            mermaAplicada: 0,
            unidad: 'KILOGRAMO',
            producto: { id: 'prod-1', nombre: 'Harina', deletedAt: null },
          },
        ],
      });

    mockProductoProveedorRepository.find.mockResolvedValue([
      {
        id: 'pp-1',
        productoId: 'prod-1',
        proveedorId: 'prov-1',
        precioUnitario: 2.5,
      },
    ]);

    mockPedidoService.create.mockResolvedValue({ id: 'pedido-1' });

    const result = await service.generateFromRecetas(
      { recetaIds: ['receta-1', 'receta-2'], observaciones: 'Prueba' },
      'user-1'
    );

    expect(mockPedidoService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        proveedorId: 'prov-1',
        lineas: [{ productoProveedorId: 'pp-1', cantidad: 3 }],
      }),
      'user-1'
    );
    expect(result).toEqual({ id: 'pedido-1' });
  });

  it('lanza 404 si alguna receta no existe', async () => {
    mockRecetaRepository.findById
      .mockResolvedValueOnce({ id: 'receta-1', nombre: 'R1', ingredientes: [] })
      .mockResolvedValueOnce(null);

    await expect(
      service.generateFromRecetas(
        { recetaIds: ['receta-1', 'receta-2'] },
        'user-1'
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza si un producto no tiene proveedor activo asignado', async () => {
    mockRecetaRepository.findById.mockResolvedValue({
      id: 'receta-1',
      nombre: 'Receta A',
      ingredientes: [
        {
          productoId: 'prod-1',
          cantidad: 2,
          mermaAplicada: 0,
          unidad: 'KILOGRAMO',
          producto: { id: 'prod-1', nombre: 'Harina', deletedAt: null },
        },
      ],
    });

    mockProductoProveedorRepository.find.mockResolvedValue([]);

    await expect(
      service.generateFromRecetas({ recetaIds: ['receta-1'] }, 'user-1')
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza si no existe un proveedor común para todos los ingredientes', async () => {
    mockRecetaRepository.findById
      .mockResolvedValueOnce({
        id: 'receta-1',
        nombre: 'Receta A',
        ingredientes: [
          {
            productoId: 'prod-1',
            cantidad: 1,
            mermaAplicada: 0,
            unidad: 'KILOGRAMO',
            producto: { id: 'prod-1', nombre: 'Harina', deletedAt: null },
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 'receta-2',
        nombre: 'Receta B',
        ingredientes: [
          {
            productoId: 'prod-2',
            cantidad: 1,
            mermaAplicada: 0,
            unidad: 'KILOGRAMO',
            producto: { id: 'prod-2', nombre: 'Azúcar', deletedAt: null },
          },
        ],
      });

    mockProductoProveedorRepository.find.mockResolvedValue([
      {
        id: 'pp-1',
        productoId: 'prod-1',
        proveedorId: 'prov-1',
        precioUnitario: 2,
      },
      {
        id: 'pp-2',
        productoId: 'prod-2',
        proveedorId: 'prov-2',
        precioUnitario: 3,
      },
    ]);

    await expect(
      service.generateFromRecetas(
        { recetaIds: ['receta-1', 'receta-2'] },
        'user-1'
      )
    ).rejects.toThrow(/un pedido solo puede pertenecer a un proveedor/i);
  });

  it('buildBatchOrderFromRecetas reparte la compra entre varios proveedores cuando hace falta', async () => {
    mockRecetaRepository.findById
      .mockResolvedValueOnce({
        id: 'receta-1',
        nombre: 'Receta A',
        ingredientes: [
          {
            productoId: 'prod-1',
            cantidad: 1,
            mermaAplicada: 0,
            unidad: 'KILOGRAMO',
            producto: { id: 'prod-1', nombre: 'Harina', deletedAt: null },
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 'receta-2',
        nombre: 'Receta B',
        ingredientes: [
          {
            productoId: 'prod-2',
            cantidad: 2,
            mermaAplicada: 0,
            unidad: 'KILOGRAMO',
            producto: { id: 'prod-2', nombre: 'Azúcar', deletedAt: null },
          },
        ],
      });

    mockProductoProveedorRepository.find.mockResolvedValue([
      {
        id: 'pp-1',
        productoId: 'prod-1',
        proveedorId: 'prov-1',
        precioUnitario: 2,
      },
      {
        id: 'pp-2',
        productoId: 'prod-2',
        proveedorId: 'prov-2',
        precioUnitario: 3,
      },
    ]);

    await expect(
      service.buildBatchOrderFromRecetas({
        recetaIds: ['receta-1', 'receta-2'],
        observaciones: 'Compra agrupada',
      })
    ).resolves.toEqual({
      observaciones: 'Compra agrupada',
      lineas: [
        { productoProveedorId: 'pp-1', cantidad: 1 },
        { productoProveedorId: 'pp-2', cantidad: 2 },
      ],
    });
  });

  it('rechaza si alguna receta contiene productos inactivos', async () => {
    mockRecetaRepository.findById.mockResolvedValue({
      id: 'receta-1',
      nombre: 'Receta Inactiva',
      ingredientes: [
        {
          productoId: 'prod-1',
          cantidad: 1,
          mermaAplicada: 0,
          unidad: 'KILOGRAMO',
          producto: {
            id: 'prod-1',
            nombre: 'Harina',
            deletedAt: new Date('2026-03-01T00:00:00.000Z'),
          },
        },
      ],
    });

    await expect(
      service.generateFromRecetas({ recetaIds: ['receta-1'] }, 'user-1')
    ).rejects.toThrow(/producto inactivo o no disponible/i);
  });

  it('rechaza si la receta referencia un producto con activo=false', async () => {
    mockRecetaRepository.findById.mockResolvedValue({
      id: 'receta-1',
      nombre: 'Receta Catálogo',
      ingredientes: [
        {
          productoId: 'prod-1',
          cantidad: 1,
          mermaAplicada: 0,
          unidad: 'KILOGRAMO',
          producto: {
            id: 'prod-1',
            nombre: 'Harina',
            deletedAt: null,
            activo: false,
          },
        },
      ],
    });

    await expect(
      service.generateFromRecetas({ recetaIds: ['receta-1'] }, 'user-1')
    ).rejects.toThrow(/producto inactivo o no disponible/i);
  });

  it('rechaza si el mismo producto aparece con unidades incompatibles', async () => {
    mockRecetaRepository.findById
      .mockResolvedValueOnce({
        id: 'receta-1',
        nombre: 'Receta A',
        ingredientes: [
          {
            productoId: 'prod-1',
            cantidad: 1,
            mermaAplicada: 0,
            unidad: 'KILOGRAMO',
            producto: { id: 'prod-1', nombre: 'Harina', deletedAt: null },
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 'receta-2',
        nombre: 'Receta B',
        ingredientes: [
          {
            productoId: 'prod-1',
            cantidad: 500,
            mermaAplicada: 0,
            unidad: 'GRAMO',
            producto: { id: 'prod-1', nombre: 'Harina', deletedAt: null },
          },
        ],
      });

    await expect(
      service.generateFromRecetas(
        { recetaIds: ['receta-1', 'receta-2'] },
        'user-1'
      )
    ).rejects.toThrow(/unidades incompatibles/i);
  });

  it('aplica merma y elige el proveedor común con menor coste total', async () => {
    mockRecetaRepository.findById
      .mockResolvedValueOnce({
        id: 'receta-1',
        nombre: 'Receta A',
        ingredientes: [
          {
            productoId: 'prod-1',
            cantidad: 2,
            mermaAplicada: 10,
            unidad: 'KILOGRAMO',
            producto: { id: 'prod-1', nombre: 'Harina', deletedAt: null },
          },
          {
            productoId: 'prod-2',
            cantidad: 1,
            mermaAplicada: 0,
            unidad: 'KILOGRAMO',
            producto: { id: 'prod-2', nombre: 'Azúcar', deletedAt: null },
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 'receta-2',
        nombre: 'Receta B',
        ingredientes: [
          {
            productoId: 'prod-1',
            cantidad: 1,
            mermaAplicada: 0,
            unidad: 'KILOGRAMO',
            producto: { id: 'prod-1', nombre: 'Harina', deletedAt: null },
          },
        ],
      });

    mockProductoProveedorRepository.find.mockResolvedValue([
      {
        id: 'pp-1-a',
        productoId: 'prod-1',
        proveedorId: 'prov-caro',
        precioUnitario: 5,
      },
      {
        id: 'pp-2-a',
        productoId: 'prod-2',
        proveedorId: 'prov-caro',
        precioUnitario: 6,
      },
      {
        id: 'pp-1-b',
        productoId: 'prod-1',
        proveedorId: 'prov-barato',
        precioUnitario: 2,
      },
      {
        id: 'pp-2-b',
        productoId: 'prod-2',
        proveedorId: 'prov-barato',
        precioUnitario: 1,
      },
    ]);

    mockPedidoService.create.mockResolvedValue({ id: 'pedido-barato' });

    await service.generateFromRecetas(
      { recetaIds: ['receta-1', 'receta-2'] },
      'user-1'
    );

    expect(mockPedidoService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        proveedorId: 'prov-barato',
        lineas: expect.arrayContaining([
          { productoProveedorId: 'pp-1-b', cantidad: 3.2 },
          { productoProveedorId: 'pp-2-b', cantidad: 1 },
        ]),
      }),
      'user-1'
    );
  });

  it('registra en logs el origen del pedido desde recetas', async () => {
    const loggerSpy = jest.spyOn((service as any).logger, 'log');

    mockRecetaRepository.findById.mockResolvedValue({
      id: 'receta-1',
      nombre: 'Receta A',
      ingredientes: [
        {
          productoId: 'prod-1',
          cantidad: 1,
          mermaAplicada: 0,
          unidad: 'KILOGRAMO',
          producto: { id: 'prod-1', nombre: 'Harina', deletedAt: null },
        },
      ],
    });

    mockProductoProveedorRepository.find.mockResolvedValue([
      {
        id: 'pp-1',
        productoId: 'prod-1',
        proveedorId: 'prov-1',
        precioUnitario: 2,
      },
    ]);

    mockPedidoService.create.mockResolvedValue({ id: 'pedido-1' });

    await service.generateFromRecetas(
      { recetaIds: ['receta-1'], observaciones: 'Origen cocina' },
      'user-1'
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Pedido pedido-1 generado desde recetas [receta-1]'
      )
    );
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Proveedor del pedido: prov-1')
    );
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Observaciones: Origen cocina')
    );
  });
});
