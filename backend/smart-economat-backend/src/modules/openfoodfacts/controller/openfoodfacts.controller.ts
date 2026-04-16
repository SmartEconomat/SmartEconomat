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
 * Controller that proxies product lookup requests to the OpenFoodFacts public API.
 * Supports barcode-based lookup and free-text name search.
 * Requires JWT authentication and at least one of the specified permissions.
 * @class OpenFoodFactsController
 */
@ApiTags('OpenFoodFacts')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('openfoodfacts')
export class OpenFoodFactsController {
  constructor(private readonly openFoodFactsService: OpenFoodFactsService) {}

  /**
   * Looks up a single product in OpenFoodFacts by barcode.
   * Returns null when the product is not found in the external database.
   * @param {string} codigoBarras - Barcode value to look up (validated before forwarding).
   * @returns {Promise<OffProductResponseDto | null>} Matched product or null.
   * @throws {BadRequestException} When the barcode fails format validation.
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
   * Searches for products in OpenFoodFacts by free-text name.
   * Devuelve un empty array when the query is blank or too long.
   * @param {string} [nombre] - Optional search term (max 200 characters).
   * @returns {Promise<OffProductResponseDto[]>} Lista de productos coincidentes.
   * @throws {BadRequestException} When the search term exceeds 200 characters.
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
