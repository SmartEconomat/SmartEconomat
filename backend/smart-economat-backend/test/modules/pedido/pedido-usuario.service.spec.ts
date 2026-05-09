import { PedidoUsuarioService } from '../../../src/modules/pedido/service/pedido-usuario.service';
import { PedidoUsuario } from '../../../src/modules/pedido/pedido-usuario.entity/pedido-usuario.entity';
import { PedidoUsuarioQueryDto } from '../../../src/modules/pedido/dto/pedido-usuario.dto';

describe('PedidoUsuarioService', () => {
  let service: PedidoUsuarioService;
  let mockDataSource: { getRepository: jest.Mock };
  let mainQb: Record<string, jest.Mock>;
  let countQb: {
    expressionMap: {
      orderBys: Record<string, unknown>;
      selectDistinctOn: string[];
      selectDistinct: boolean;
      skip?: number;
      take?: number;
      offset?: number;
      limit?: number;
      selects: unknown[];
    };
    select: jest.Mock;
    getRawOne: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    countQb = {
      expressionMap: {
        orderBys: { _seed: 'DESC' },
        selectDistinctOn: ['pedidoUsuario.id'],
        selectDistinct: true,
        skip: 0,
        take: 25,
        offset: 0,
        limit: 25,
        selects: [{ selection: 'pedidoUsuario' }],
      },
      select: jest.fn().mockImplementation(() => countQb),
      getRawOne: jest.fn().mockResolvedValue({ cnt: '42' }),
    };

    mainQb = {};
    const chain = () => mainQb;
    mainQb.leftJoinAndSelect = jest.fn(chain);
    mainQb.where = jest.fn(chain);
    mainQb.andWhere = jest.fn(chain);
    mainQb.distinctOn = jest.fn(chain);
    mainQb.orderBy = jest.fn(chain);
    mainQb.addOrderBy = jest.fn(chain);
    mainQb.skip = jest.fn(chain);
    mainQb.take = jest.fn(chain);
    mainQb.clone = jest.fn().mockReturnValue(countQb);
    mainQb.getMany = jest.fn().mockResolvedValue([]);
    mainQb.getManyAndCount = jest.fn();

    mockDataSource = {
      getRepository: jest.fn().mockImplementation((entity: unknown) => {
        if (entity === PedidoUsuario) {
          return {
            createQueryBuilder: jest.fn().mockReturnValue(mainQb),
          };
        }
        return { find: jest.fn().mockResolvedValue([]) };
      }),
    };

    service = new PedidoUsuarioService(
      mockDataSource as never,
      { get: jest.fn().mockReturnValue(48) } as never,
      {} as never,
      {} as never
    );
  });

  describe('findAll', () => {
    it('usa getMany y COUNT(DISTINCT) en paralelo; no llama getManyAndCount (distinctOn + PostgreSQL)', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
      } as PedidoUsuarioQueryDto);

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(PedidoUsuario);
      expect(mainQb.distinctOn).toHaveBeenCalledWith(['pedidoUsuario.id']);
      expect(mainQb.clone).toHaveBeenCalledTimes(1);
      expect(mainQb.getMany).toHaveBeenCalledTimes(1);
      expect(mainQb.getManyAndCount).not.toHaveBeenCalled();

      expect(countQb.select).toHaveBeenCalledWith(
        'COUNT(DISTINCT "pedidoUsuario"."id")',
        'cnt'
      );
      expect(countQb.getRawOne).toHaveBeenCalledTimes(1);

      expect(countQb.expressionMap.orderBys).toEqual({});
      expect(countQb.expressionMap.selectDistinctOn).toEqual([]);
      expect(countQb.expressionMap.selectDistinct).toBe(false);
      expect(countQb.expressionMap.skip).toBeUndefined();
      expect(countQb.expressionMap.take).toBeUndefined();
      expect(countQb.expressionMap.offset).toBeUndefined();
      expect(countQb.expressionMap.limit).toBeUndefined();
      expect(countQb.expressionMap.selects).toEqual([]);

      expect(result.total).toBe(42);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
      expect(result.data).toEqual([]);
      expect(result.totalPages).toBe(2);
    });
  });
});
