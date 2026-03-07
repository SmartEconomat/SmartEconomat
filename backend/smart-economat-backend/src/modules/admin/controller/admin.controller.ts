import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { AdminService } from '../service/admin.service';
import { CreateProfesorDto } from '../../profesor/dto/create-profesor.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('profesores')
  @Roles(rolUsuario.ADMINISTRADOR)
  async createProfesor(@Body() dto: CreateProfesorDto) {
    return this.adminService.createProfesor(dto);
  }

  @Patch('users/:id/activate')
  @Roles(rolUsuario.ADMINISTRADOR)
  async activateUser(@Param('id') userId: string) {
    return this.adminService.activateUser(userId);
  }

  @Post('users/:id/force-reset')
  @Roles(rolUsuario.ADMINISTRADOR)
  async forcePasswordReset(@Param('id') userId: string) {
    return this.adminService.forcePasswordReset(userId);
  }
}
