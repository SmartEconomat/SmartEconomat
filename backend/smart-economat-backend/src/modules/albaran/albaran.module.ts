import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Albaran } from './albaran.entity/albaran.entity';
import { AlbaranController } from './controller/albaran.controller';
import { AlbaranService } from './service/albaran.service';

@Module({
  imports: [TypeOrmModule.forFeature([Albaran])],
  controllers: [AlbaranController],
  providers: [AlbaranService],
  exports: [AlbaranService],
})
export class AlbaranModule {}
