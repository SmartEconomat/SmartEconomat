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
    update: jest.fn(),
    softDelete: jest.fn(),
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
    const getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
    const queryBuilder = {
      withDeleted: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount,
    };
    mockProveedorRepository.createQueryBuilder = jest
      .fn()
      .mockReturnValue(queryBuilder);

    const result = await service.findAll({
      page: 2,
      limit: 5,
      sortBy: 'email',
      order: 'DESC',
      searchTerm: 'acme',
    } as PaginationQueryDto);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'proveedor.deleted_at IS NULL'
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'proveedor.email',
      'DESC'
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
    expect(result).toEqual({
      data: [],
      total: 0,
      page: 2,
      limit: 5,
      totalPages: 1,
    });
  });

  it('findAll con includeDeleted lista solo proveedores eliminados (admin)', async () => {
    const getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
    const queryBuilder = {
      withDeleted: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount,
    };
    mockProveedorRepository.createQueryBuilder = jest
      .fn()
      .mockReturnValue(queryBuilder);

    await service.findAll(
      { includeDeleted: true } as PaginationQueryDto,
      'ADMIN'
    );

    expect(queryBuilder.withDeleted).toHaveBeenCalled();
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'proveedor.deleted_at IS NOT NULL'
    );
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

  it('remove realiza un borrado lógico del proveedor', async () => {
    mockProveedorRepository.findOne.mockResolvedValue({ id: 'prov-1' });

    await service.remove('prov-1', 'user-test');

    expect(mockProveedorRepository.update).toHaveBeenCalledWith('prov-1', {
      deletedBy: 'user-test',
    });
    expect(mockProveedorRepository.softDelete).toHaveBeenCalledWith('prov-1');
  });
});
