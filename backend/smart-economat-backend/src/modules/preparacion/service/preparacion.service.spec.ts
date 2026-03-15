import { Test, TestingModule } from '@nestjs/testing';
import { PreparacionService } from './preparacion.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PreparacionEntity } from '../preparacion.entity';
import { Repository } from 'typeorm';
import { Producto } from 'src/modules/producto/producto.entity/producto.entity';

describe('PreparacionService', () => {
  let service: PreparacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreparacionService,
        {
          provide: getRepositoryToken(PreparacionEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Producto),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<PreparacionService>(PreparacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
