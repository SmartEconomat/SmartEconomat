import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
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

@ApiTags('OpenFoodFacts')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('openfoodfacts')
export class OpenFoodFactsController {
  constructor(private readonly openFoodFactsService: OpenFoodFactsService) {}

  @Get('producto/:codigoBarras')
  @RequireAnyPermission(
    'productos:listar',
    'productos:ver',
    'inventario:listar',
    'recepciones:listar',
    'recepciones:crear'
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
      throw new BadRequestException('Código de barras inválido');
    }

    return this.openFoodFactsService.searchByBarcode(trimmedBarcode);
  }

  @Get('buscar')
  @RequireAnyPermission(
    'productos:listar',
    'productos:ver',
    'inventario:listar',
    'recepciones:listar',
    'recepciones:crear'
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
