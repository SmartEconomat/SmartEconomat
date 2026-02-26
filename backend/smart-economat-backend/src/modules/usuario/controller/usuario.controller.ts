import {
  Controller,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsuarioService } from '../service/usuario.service';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../enums/usuario.enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get()
  @Roles(rolUsuario.ADMINISTRADOR)
  findAll() {
    return this.usuarioService.findAll();
  }

  @Get(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  findOne(@Param('id') id: string) {
    return this.usuarioService.findOne(id);
  }

  @Patch(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  update(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuarioService.update(id, dto);
  }

  @Delete(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  remove(@Param('id') id: string) {
    return this.usuarioService.remove(id);
  }
}
