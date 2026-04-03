import { RecetaRepository } from '../../../src/modules/receta/repository/receta.repository';

describe('RecetaRepository', () => {
  const mockRecetaRepo = {
    findAndCount: jest.fn(),
  };

  let repository: RecetaRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new RecetaRepository(mockRecetaRepo as any, {} as any);
  });

  it('findAllPaginated no incluye recetas soft-deleted para admin', async () => {
    mockRecetaRepo.findAndCount.mockResolvedValue([[], 0]);

    await repository.findAllPaginated(
      {
        page: 1,
        limit: 20,
        sortBy: 'nombre',
        order: 'ASC',
      } as any,
      'ADMIN'
    );

    expect(mockRecetaRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        withDeleted: false,
      })
    );
  });
});
