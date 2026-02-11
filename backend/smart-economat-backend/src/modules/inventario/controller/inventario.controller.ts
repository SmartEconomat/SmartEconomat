import { Controller, Get } from '@nestjs/common';
import { InventarioService } from '../service/inventario.service';
import { AlertaCaducidadDTO } from '../dto/alertaCaducidad.dto';
import { AlertaStockDTO } from '../dto/alertaStock.dto';
@Controller('Alertas')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get('caducidad')
  async alertasCaducidad(): Promise<AlertaCaducidadDTO[]> {
    return this.inventarioService.obtenerAlertasCaducidad();
  }

  @Get('stock')
  async alertasStock(): Promise<AlertaStockDTO[]> {
    return this.inventarioService.obtenerAlertasStock();
  }
}
