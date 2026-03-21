import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProfesorService } from '../service/profesor.service';
import { CreateSlotDto } from '../dto/create-slot.dto';
import { UpdateSlotDto } from '../dto/update-slot.dto';
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

  @Post('admin-slots')
  @RequirePermissions('usuarios:listar')
  async adminCreateSlot(@Body() dto: CreateSlotDto & { profesorId: string }) {
    return this.profesorService.adminCreateSlot(dto);
  }

  @Get('slots')
  @RequirePermissions('profesor:gestionar_slots')
  async getSlots(@GetUser('id') userId: string) {
    return this.profesorService.getSlots(userId);
  }

  @Get('all-slots')
  @RequirePermissions('usuarios:listar')
  async getAllSlots() {
    return this.profesorService.getAllSlots();
  }

  @Get('all-profesores')
  @RequirePermissions('usuarios:listar')
  async getAllProfesores() {
    return this.profesorService.getAllProfesores();
  }

  @Patch('admin-slots/:id')
  @RequirePermissions('usuarios:listar')
  async adminUpdateSlot(
    @Param('id') slotId: string,
    @Body() dto: UpdateSlotDto & { profesorId?: string }
  ) {
    return this.profesorService.adminUpdateSlot(slotId, dto);
  }

  @Patch('slots/:id')
  @RequirePermissions('profesor:gestionar_slots')
  async updateSlot(
    @GetUser('id') userId: string,
    @Param('id') slotId: string,
    @Body() dto: UpdateSlotDto
  ) {
    return this.profesorService.updateSlot(userId, slotId, dto);
  }

  @Delete('slots/:id')
  @RequirePermissions('profesor:gestionar_slots')
  async deleteSlot(@GetUser('id') userId: string, @Param('id') slotId: string) {
    return this.profesorService.deleteSlot(userId, slotId);
  }

  @Delete('admin-slots/:id')
  @RequirePermissions('usuarios:listar')
  async adminDeleteSlot(@Param('id') slotId: string) {
    return this.profesorService.adminDeleteSlot(slotId);
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
