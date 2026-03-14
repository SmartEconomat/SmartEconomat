import { BadRequestException, ConflictException } from '@nestjs/common';
import { PermisosService } from '../../../src/modules/permisos/service/permisos.service';

describe('PermisosService', () => {
  const mockPermisoRepo = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    softDelete: jest.fn(),
  };

  let service: PermisosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PermisosService(mockPermisoRepo as any);
  });

  function createQueryBuilder(result: unknown) {
    return {
      where: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(result),
      getRawOne: jest.fn().mockResolvedValue(result),
    };
  }

  it('create rechaza códigos duplicados', async () => {
    mockPermisoRepo.findOne.mockResolvedValue({ id: 'perm-1' });

    await expect(
      service.create({ codigo: 'usuarios:listar' } as any)
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('createMany crea permisos en batch', async () => {
    mockPermisoRepo.create.mockImplementation((dto: unknown) => dto);
    mockPermisoRepo.save.mockImplementation((items: unknown[]) =>
      Promise.resolve(items)
    );

    const result = await service.createMany([
      { codigo: 'usuarios:listar' },
      { codigo: 'usuarios:crear' },
    ] as any);

    expect(mockPermisoRepo.create).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      { codigo: 'usuarios:listar' },
      { codigo: 'usuarios:crear' },
    ]);
  });

  it('findByCodigo devuelve null si no existe', async () => {
    mockPermisoRepo.findOne.mockResolvedValue(null);

    await expect(service.findByCodigo('missing')).resolves.toBeNull();
  });

  it('findByCodigos devuelve array vacío si la entrada está vacía', async () => {
    await expect(service.findByCodigos([])).resolves.toEqual([]);
    expect(mockPermisoRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('findGroupedByModule agrupa permisos activos por módulo', async () => {
    mockPermisoRepo.find.mockResolvedValue([
      { id: '1', modulo: 'usuarios', accion: 'crear' },
      { id: '2', modulo: 'usuarios', accion: 'listar' },
      { id: '3', modulo: 'pedidos', accion: 'crear' },
    ]);

    const result = await service.findGroupedByModule();

    expect(result).toEqual({
      usuarios: [
        { id: '1', modulo: 'usuarios', accion: 'crear' },
        { id: '2', modulo: 'usuarios', accion: 'listar' },
      ],
      pedidos: [{ id: '3', modulo: 'pedidos', accion: 'crear' }],
    });
  });

  it('remove rechaza permisos usados por roles indicando la cantidad', async () => {
    mockPermisoRepo.createQueryBuilder.mockReturnValue(
      createQueryBuilder({ count: '2' })
    );

    await expect(service.remove('perm-2')).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(mockPermisoRepo.softDelete).not.toHaveBeenCalled();
  });
});
