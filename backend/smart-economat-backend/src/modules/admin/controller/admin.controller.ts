import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminService } from '../service/admin.service';
import { CreateProfesorDto } from '../../profesor/dto/create-profesor.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('profesores')
  @RequirePermissions('usuarios:crear')
  async createProfesor(@Body() dto: CreateProfesorDto) {
    return this.adminService.createProfesor(dto);
  }

  @Patch('users/:id/activate')
  @RequirePermissions('usuarios:activar_desactivar')
  async activateUser(@Param('id') userId: string) {
    return this.adminService.activateUser(userId);
  }

  @Post('users/:id/force-reset')
  @RequirePermissions('usuarios:resetear_password')
  async forcePasswordReset(@Param('id') userId: string) {
    return this.adminService.forcePasswordReset(userId);
  }
}
