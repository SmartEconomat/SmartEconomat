import { Controller, Get, UseGuards } from '@nestjs/common';
import { InventarioService } from '../service/inventario.service';
import { AlertaCaducidadDTO } from '../dto/alertaCaducidad.dto';
import { AlertaStockDTO } from '../dto/alertaStock.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/permisos.guard';

@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('alertas')
export class AlertaController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get('caducidad')
  @RequirePermissions('inventario:ver')
  alertasCaducidad(): Promise<AlertaCaducidadDTO[]> {
    return this.inventarioService.obtenerAlertasCaducidad();
  }

  @Get('stock')
  @RequirePermissions('inventario:ver')
  alertasStock(): Promise<AlertaStockDTO[]> {
    return this.inventarioService.obtenerAlertasStock();
  }
}
