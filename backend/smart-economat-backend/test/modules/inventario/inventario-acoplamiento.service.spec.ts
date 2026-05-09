import { Test, TestingModule } from '@nestjs/testing';
import { InventarioService } from '../../../src/modules/inventario/service/inventario.service';
import { InventarioRepository } from '../../../src/modules/inventario/repository/inventario.repository';
import { ProductoProveedor } from '../../../src/modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { MovimientoHelper } from '../../../src/common/helpers/movimiento.helper';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventarioListQueryDto } from '../../../src/modules/inventario/dto/inventario-list-query.dto';
import { InventarioTransferenciaStockService } from '../../../src/modules/inventario/service/inventario-transferencia-stock.service';
import { UbicacionAccesoPoliticaService } from '../../../src/modules/ubicacion/service/ubicacion-acceso-politica.service';

describe('InventarioService (Desacoplamiento Ubicaciones)', () => {
  let service: InventarioService;
  let inventarioRepository: any;

  const mockQueryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    withDeleted: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    inventarioRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventarioService,
        {
          provide: InventarioRepository,
          useValue: inventarioRepository,
        },
        {
          provide: getRepositoryToken(ProductoProveedor),
          useValue: {},
        },
        {
          provide: MovimientoHelper,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {},
        },
        {
          provide: InventarioTransferenciaStockService,
          useValue: { ejecutarTransferenciaInmediata: jest.fn() },
        },
        {
          provide: UbicacionAccesoPoliticaService,
          useValue: {
            assertPuedeTransferirEnUbicaciones: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InventarioService>(InventarioService);
  });

  it('findAll debe usar leftJoinAndSelect para la ubicación', async () => {
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
    const query: InventarioListQueryDto = { page: 1, limit: 10 };

    await service.findAll(query);

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'inv.cantidadActual > 0'
    );

    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'inv.ubicacion',
      'ubicacion'
    );
  });

  it('findOne debe permitir registros sin ubicación', async () => {
    const mockItem = { id: '1', productoProveedor: {}, ubicacion: null };
    inventarioRepository.findOne.mockResolvedValue(mockItem);

    const result = await service.findOne('1');

    expect(result).toBeDefined();
    expect(result.ubicacion).toBeNull();
  });
});
