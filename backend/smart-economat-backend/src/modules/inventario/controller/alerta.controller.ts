import { Controller, Get, UseGuards } from '@nestjs/common';
import { InventarioService } from '../service/inventario.service';
import { AlertaCaducidadDTO } from '../dto/alertaCaducidad.dto';
import { AlertaStockDTO } from '../dto/alertaStock.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/** Clase pública (AlertaController). Paquete: smart-economat-backend (Nest). */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('alertas')
export class AlertaController {
  /**
   * Construye la instancia configurada.
   * @undefined {InventarioService} inventarioService - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly inventarioService: InventarioService) {}

  /**
   * Expone "alertasCaducidad" en smart-economat-backend (Nest).
   * @undefined {Promise<AlertaCaducidadDTO[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('caducidad')
  @RequirePermissions(PERMISSIONS.inventario.ver)
  alertasCaducidad(): Promise<AlertaCaducidadDTO[]> {
    return this.inventarioService.obtenerAlertasCaducidad();
  }

  /**
   * Expone "alertasStock" en smart-economat-backend (Nest).
   * @undefined {Promise<AlertaStockDTO[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('stock')
  @RequirePermissions(PERMISSIONS.inventario.ver)
  alertasStock(): Promise<AlertaStockDTO[]> {
    return this.inventarioService.obtenerAlertasStock();
  }
}
