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
  UseGuards,
  ParseUUIDPipe,
  Query,
  Request,
} from '@nestjs/common';
import { CreateRecepcionDto } from '../dto/create-recepcion.dto';
import { ApiQuery } from '@nestjs/swagger';
import { UpdateRecepcionDto } from '../dto/update-recepcion.dto';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { RecepcionService } from '../service/recepcion.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recepcion')
export class RecepcionController {
  constructor(private readonly recepcionService: RecepcionService) {}

  @Post()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateRecepcionDto,
    @Request() req: any
  ): Promise<Recepcion> {
    const userId = req.user.sub;
    return this.recepcionService.create(dto, userId);
  }

  @Get()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query() query: PaginationQueryDto
  ): Promise<
    import('../../../common/dto/paginated-response.dto').PaginatedResponseDto<Recepcion>
  > {
    return this.recepcionService.findAll(query);
  }

  @Get(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Recepcion> {
    return this.recepcionService.findOne(id);
  }

  @Patch(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecepcionDto
  ): Promise<Recepcion> {
    return this.recepcionService.update(id, dto);
  }

  @Delete(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.recepcionService.remove(id);
  }
}
