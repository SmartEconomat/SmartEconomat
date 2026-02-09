import { Inventario } from '../inventario.entity/inventario.entity';
import { Injectable } from '@nestjs/common';
import { Between, Repository } from 'typeorm';
import { AlertaStockDTO } from '../dto/alertaStock.dto';
import { AlertaCaducidadDTO } from '../dto/alertaCaducidad.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private inventarioRepository: Repository<Inventario>
  ) {}

  async obtenerAlertasCaducidad(): Promise<AlertaCaducidadDTO[]> {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + 7);

    const productos = await this.inventarioRepository.find({
      where: {
        fecha_caducidad: Between(hoy, limite),
      },
    });

    return productos.map((p) => ({
      id: p.id,
      fecha_caducidad: p.fecha_caducidad.toISOString(),
    }));
  }

  async obtenerAlertasStock(): Promise<AlertaStockDTO[]> {
    const productos = await this.inventarioRepository
      .createQueryBuilder('inventario')
      .where('inventario.cantidad_actual < inventario.cantidad_minima')
      .getMany();

    return productos.map((p) => ({
      id: p.id,
      cantidad_actual: p.cantidad_actual,
      cantidad_minima: p.cantidad_minima,
    }));
  }
}
