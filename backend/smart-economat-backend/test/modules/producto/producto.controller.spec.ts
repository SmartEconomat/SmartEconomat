import { Test, TestingModule } from '@nestjs/testing';
import { ProductoController } from '../../../src/modules/producto/controller/producto.controller';
import { ProductoService } from '../../../src/modules/producto/service/producto.service';

describe('ProductoController', () => {
  let controller: ProductoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductoController],
      providers: [ProductoService],
    }).compile();

    controller = module.get<ProductoController>(ProductoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
