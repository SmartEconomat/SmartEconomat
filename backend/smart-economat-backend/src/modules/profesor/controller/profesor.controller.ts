import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProfesorService } from '../service/profesor.service';
import { CreateSlotDto } from '../dto/create-slot.dto';
import { CreateProfesorDto } from '../dto/create-profesor.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('profesores')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ProfesorController {
  constructor(private readonly profesorService: ProfesorService) {}

  @Post('register')
  @Public()
  async register(@Body() dto: CreateProfesorDto) {
    return this.profesorService.register(dto);
  }

  @Post('slots')
  @RequirePermissions('profesor:gestionar_slots')
  async createSlot(@GetUser('id') userId: string, @Body() dto: CreateSlotDto) {
    return this.profesorService.createSlot(userId, dto);
  }

  @Patch('alumnos/:id/activate')
  @RequirePermissions('profesor:gestionar_alumnos')
  async activateAlumno(
    @GetUser('id') profesorUserId: string,
    @Param('id') alumnoId: string
  ) {
    return this.profesorService.activateAlumno(profesorUserId, alumnoId);
  }

  @Get('alumnos')
  @RequirePermissions('profesor:ver_alumnos')
  async getAlumnos(@GetUser('id') profesorUserId: string) {
    return this.profesorService.getAlumnos(profesorUserId);
  }

  @Post('alumnos/:id/force-reset')
  @RequirePermissions('profesor:gestionar_alumnos')
  async forcePasswordReset(
    @GetUser('id') profesorUserId: string,
    @Param('id') alumnoId: string
  ) {
    return this.profesorService.forcePasswordReset(profesorUserId, alumnoId);
  }
}
