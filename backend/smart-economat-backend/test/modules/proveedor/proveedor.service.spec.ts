import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../../../src/common/dto/pagination-query.dto';
import { ProveedorService } from '../../../src/modules/proveedor/service/proveedor.service';

describe('ProveedorService', () => {
  const mockProveedorRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  };

  let service: ProveedorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProveedorService(mockProveedorRepository as any);
  });

  it('create rechaza nombre duplicado', async () => {
    mockProveedorRepository.findOne.mockResolvedValueOnce({ id: 'prov-1' });

    await expect(
      service.create({ nombre: 'Proveedor duplicado', nif: 'A12345678' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create rechaza NIF duplicado', async () => {
    mockProveedorRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'prov-2' });

    await expect(
      service.create({ nombre: 'Proveedor nuevo', nif: 'A12345678' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findAll construye búsqueda multi-campo con paginación y orden', async () => {
    mockProveedorRepository.findAndCount.mockResolvedValue([[], 0]);

    const result = await service.findAll({
      page: 2,
      limit: 5,
      sortBy: 'email',
      order: 'DESC',
      searchTerm: 'acme',
    } as PaginationQueryDto);

    const findArgs = mockProveedorRepository.findAndCount.mock.calls[0][0];

    expect(Array.isArray(findArgs.where)).toBe(true);
    expect(findArgs.where).toHaveLength(4);
    expect(findArgs.order).toEqual({ email: 'DESC' });
    expect(findArgs.skip).toBe(5);
    expect(findArgs.take).toBe(5);
    expect(result).toEqual({
      data: [],
      total: 0,
      page: 2,
      limit: 5,
      totalPages: 1,
    });
  });

  it('findOne lanza NotFoundException si el proveedor no existe', async () => {
    mockProveedorRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('prov-missing')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('update revalida unicidad del nombre', async () => {
    mockProveedorRepository.findOne
      .mockResolvedValueOnce({
        id: 'prov-1',
        nombre: 'Nombre actual',
        nif: 'A12345678',
        productos: [],
      })
      .mockResolvedValueOnce({ id: 'prov-2', nombre: 'Nombre duplicado' });

    await expect(
      service.update('prov-1', { nombre: 'Nombre duplicado' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('remove rechaza proveedores con productos vinculados', async () => {
    mockProveedorRepository.findOne.mockResolvedValue({
      id: 'prov-1',
      productos: [{ id: 'producto-1' }],
      pedidos: [],
    });

    await expect(service.remove('prov-1')).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(mockProveedorRepository.remove).not.toHaveBeenCalled();
  });

  it('remove rechaza proveedores con pedidos vinculados', async () => {
    mockProveedorRepository.findOne.mockResolvedValue({
      id: 'prov-2',
      productos: [],
      pedidos: [{ id: 'pedido-1' }],
    });

    await expect(service.remove('prov-2')).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(mockProveedorRepository.remove).not.toHaveBeenCalled();
  });
});
