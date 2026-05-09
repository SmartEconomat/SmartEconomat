import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { isValidBarcode } from '../../../common/validators/barcode.validator';
import { RequireAnyPermission } from '../../../common/decorators/require-any-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { OffProductResponseDto } from '../dto/off-product-response.dto';
import { OpenFoodFactsService } from '../service/openfoodfacts.service';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Controlador REST para open food facts.
 */
@ApiTags('OpenFoodFacts')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('openfoodfacts')
export class OpenFoodFactsController {
  /**
   * Construye la instancia configurada.
   * @undefined {OpenFoodFactsService} openFoodFactsService - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly openFoodFactsService: OpenFoodFactsService) {}

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "searchByBarcode" en smart-economat-backend (Nest).
   * @undefined {string} codigoBarras - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<OffProductResponseDto | null>} Datos efectivos después de ejecutar la operación.
   */
  @Get('producto/:codigoBarras')
  @RequireAnyPermission(
    PERMISSIONS.productos.listar,
    PERMISSIONS.productos.ver,
    PERMISSIONS.inventario.listar,
    PERMISSIONS.recepciones.listar,
    PERMISSIONS.recepciones.crear
  )
  @ApiOperation({
    summary: 'Buscar un producto en OpenFoodFacts por código de barras',
  })
  @ApiParam({
    name: 'codigoBarras',
    description: 'Código de barras o identificador consultado en OpenFoodFacts',
  })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado o null si no existe en OpenFoodFacts',
    type: OffProductResponseDto,
  })
  async searchByBarcode(
    @Param('codigoBarras') codigoBarras: string
  ): Promise<OffProductResponseDto | null> {
    const trimmedBarcode = codigoBarras.trim();

    if (!trimmedBarcode) {
      return null;
    }

    if (!isValidBarcode(trimmedBarcode)) {
      throw new BadRequestException(I18nHelper.getError('BARCODE_INVALID'));
    }

    return this.openFoodFactsService.searchByBarcode(trimmedBarcode);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "searchByName" en smart-economat-backend (Nest).
   * @undefined {string | undefined} nombre - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<OffProductResponseDto[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('buscar')
  @RequireAnyPermission(
    PERMISSIONS.productos.listar,
    PERMISSIONS.productos.ver,
    PERMISSIONS.inventario.listar,
    PERMISSIONS.recepciones.listar,
    PERMISSIONS.recepciones.crear
  )
  @ApiOperation({
    summary: 'Buscar productos en OpenFoodFacts por nombre',
  })
  @ApiQuery({
    name: 'nombre',
    required: false,
    type: String,
    description: 'Texto libre a buscar en OpenFoodFacts',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de coincidencias en OpenFoodFacts',
    type: OffProductResponseDto,
    isArray: true,
  })
  async searchByName(
    @Query('nombre') nombre?: string
  ): Promise<OffProductResponseDto[]> {
    const trimmedName = String(nombre || '').trim();

    if (!trimmedName) {
      return [];
    }

    if (trimmedName.length > 200) {
      throw new BadRequestException(
        'El término de búsqueda es demasiado largo'
      );
    }

    return this.openFoodFactsService.searchByName(trimmedName);
  }
}
