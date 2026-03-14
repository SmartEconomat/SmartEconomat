import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlantillasRolesService } from '../../../src/modules/plantillas-roles/service/plantillas-roles.service';

describe('PlantillasRolesService', () => {
  const mockPlantillaRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
  };
  const mockPermisoRepo = {
    find: jest.fn(),
  };
  const mockRolRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  let service: PlantillasRolesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlantillasRolesService(
      mockPlantillaRepo as any,
      mockPermisoRepo as any,
      mockRolRepo as any
    );
  });

  it('create vincula plantilla padre y permisos', async () => {
    mockPlantillaRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'padre-1' });
    mockPlantillaRepo.create.mockReturnValue({ id: 'plant-1' });
    mockPlantillaRepo.save
      .mockResolvedValueOnce({ id: 'plant-1', permisos: [] })
      .mockResolvedValueOnce({ id: 'plant-1', permisos: [{ id: 'perm-1' }] });
    mockPermisoRepo.find.mockResolvedValue([{ id: 'perm-1' }]);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'plant-1' } as any);

    const result = await service.create({
      nombre: 'Plantilla Compras',
      plantillaPadreId: 'padre-1',
      permisoIds: ['perm-1'],
    } as any);

    expect(result).toEqual({ id: 'plant-1' });
  });

  it('create rechaza plantilla padre inexistente', async () => {
    mockPlantillaRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(
      service.create({ nombre: 'Hija', plantillaPadreId: 'missing' } as any)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update rechaza plantillas no editables', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'plant-2',
      esEditable: false,
    } as any);

    await expect(
      service.update('plant-2', { nombre: 'Nuevo nombre' } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('remove rechaza plantillas de sistema', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'plant-3',
      esEditable: false,
    } as any);

    await expect(service.remove('plant-3')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('getPermisosWithInheritance resuelve herencia recursiva sin duplicados', async () => {
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValueOnce({
        id: 'hijo',
        permisos: [{ id: 'perm-a' }, { id: 'perm-b' }],
        plantillaPadreId: 'padre',
      } as any)
      .mockResolvedValueOnce({
        id: 'padre',
        permisos: [{ id: 'perm-b' }, { id: 'perm-c' }],
        plantillaPadreId: 'abuelo',
      } as any)
      .mockResolvedValueOnce({
        id: 'abuelo',
        permisos: [{ id: 'perm-d' }],
        plantillaPadreId: null,
      } as any);

    const result = await (service as any).getPermisosWithInheritance('hijo');

    expect(result.sort()).toEqual(['perm-a', 'perm-b', 'perm-c', 'perm-d']);
  });

  it('createRolFromPlantilla crea un rol con permisos heredados', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'plant-4',
      descripcion: 'Base',
    } as any);
    jest
      .spyOn(service as any, 'getPermisosWithInheritance')
      .mockResolvedValue(['perm-1', 'perm-2']);
    mockRolRepo.create.mockReturnValue({ id: 'rol-1', nombre: 'ROL_X' });
    mockRolRepo.save
      .mockResolvedValueOnce({ id: 'rol-1', nombre: 'ROL_X' })
      .mockResolvedValueOnce({ id: 'rol-1', permisos: [{ id: 'perm-1' }] });
    mockPermisoRepo.find.mockResolvedValue([
      { id: 'perm-1' },
      { id: 'perm-2' },
    ]);

    const result = await service.createRolFromPlantilla('plant-4', 'ROL_X');

    expect(result).toEqual({
      id: 'rol-1',
      nombre: 'ROL_X',
      permisos: [{ id: 'perm-1' }, { id: 'perm-2' }],
    });
  });
});
