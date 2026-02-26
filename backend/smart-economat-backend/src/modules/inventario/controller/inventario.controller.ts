import { Controller, Get, UseGuards } from '@nestjs/common';
import { InventarioService } from '../service/inventario.service';
import { AlertaCaducidadDTO } from '../dto/alertaCaducidad.dto';
import { AlertaStockDTO } from '../dto/alertaStock.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('Alertas')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get('caducidad')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  async alertasCaducidad(): Promise<AlertaCaducidadDTO[]> {
    return this.inventarioService.obtenerAlertasCaducidad();
  }

  @Get('stock')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  async alertasStock(): Promise<AlertaStockDTO[]> {
    return this.inventarioService.obtenerAlertasStock();
  }
}
