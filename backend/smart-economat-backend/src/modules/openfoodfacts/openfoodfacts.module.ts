import { Module } from '@nestjs/common';
import { OpenFoodFactsController } from './controller/openfoodfacts.controller';
import { OpenFoodFactsService } from './service/openfoodfacts.service';

@Module({
  controllers: [OpenFoodFactsController],
  providers: [OpenFoodFactsService],
  exports: [OpenFoodFactsService],
})
export class OpenfoodfactsModule {}
