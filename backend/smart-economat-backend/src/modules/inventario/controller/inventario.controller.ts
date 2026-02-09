import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InventarioService } from '../service/inventario.service';
import { AlertaCaducidad} from '../dto/alertaCaducidad.dto'
import { AlertaStock } from '../dto/alertaStock.dto';
import { Inventario } from '../inventario.entity/inventario.entity';

@Controller('Alertas')
export class InventarioController {
    constructor( private readonly inventarioService: InventarioService) {}

    @Get('caducidad')
    async alertasCaducidad(): Promise<AlertaCaducidad[]> {
        return this.inventarioService.obtenerAlertasCaducidad();
    }

    @Get('stock')
    async alertasStock(): Promise<AlertaStock[]> {
        return this.inventarioService.obtenerAlertasStock();
    }
}