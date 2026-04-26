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
import { AdminCreateSlotDto } from '../dto/admin-create-slot.dto';
import { AdminUpdateSlotDto } from '../dto/admin-update-slot.dto';
import { CreateProfesorDto } from '../dto/create-profesor.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Documentación en español.
 */
@Controller('profesores')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ProfesorController {
  constructor(private readonly profesorService: ProfesorService) {}

        /**
     * Documentación en español.
     */
  @Post('register')
  @Public()
  async register(@Body() dto: CreateProfesorDto) {
    return this.profesorService.register(dto);
  }

        /**
     * Documentación en español.
     */
  @Post('slots')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_slots)
  async createSlot(@GetUser('id') userId: string, @Body() dto: CreateSlotDto) {
    return this.profesorService.createSlot(userId, dto);
  }

        /**
     * Documentación en español.
     */
  @Post('admin-slots')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async adminCreateSlot(@Body() dto: AdminCreateSlotDto) {
    return this.profesorService.adminCreateSlot(dto);
  }

        /**
     * Documentación en español.
     */
  @Get('slots')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_slots)
  async getSlots(@GetUser('id') userId: string) {
    return this.profesorService.getSlots(userId);
  }

        /**
     * Documentación en español.
     */
  @Get('all-slots')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getAllSlots() {
    return this.profesorService.getAllSlots();
  }

        /**
     * Documentación en español.
     */
  @Get('all-profesores')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getAllProfesores() {
    return this.profesorService.getAllProfesores();
  }

        /**
     * Documentación en español.
     */
  @Patch('admin-slots/:id')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async adminUpdateSlot(
    @Param('id') slotId: string,
    @Body() dto: AdminUpdateSlotDto
  ) {
    return this.profesorService.adminUpdateSlot(slotId, dto);
  }

        /**
     * Documentación en español.
     */
  @Patch('slots/:id')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_slots)
  async updateSlot(
    @GetUser('id') userId: string,
    @Param('id') slotId: string,
    @Body() dto: UpdateSlotDto
  ) {
    return this.profesorService.updateSlot(userId, slotId, dto);
  }

        /**
     * Documentación en español.
     */
  @Delete('slots/:id')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_slots)
  async deleteSlot(@GetUser('id') userId: string, @Param('id') slotId: string) {
    return this.profesorService.deleteSlot(userId, slotId);
  }

        /**
     * Documentación en español.
     */
  @Delete('admin-slots/:id')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async adminDeleteSlot(@Param('id') slotId: string) {
    return this.profesorService.adminDeleteSlot(slotId);
  }

        /**
     * Documentación en español.
     */
  @Patch('alumnos/:id/activate')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_alumnos)
  async activateAlumno(
    @GetUser('id') profesorUserId: string,
    @Param('id') alumnoId: string
  ) {
    return this.profesorService.activateAlumno(profesorUserId, alumnoId);
  }

        /**
     * Documentación en español.
     */
  @Get('alumnos')
  @RequirePermissions(PERMISSIONS.profesor.ver_alumnos)
  async getAlumnos(@GetUser('id') profesorUserId: string) {
    return this.profesorService.getAlumnos(profesorUserId);
  }

        /**
     * Documentación en español.
     */
  @Post('alumnos/:id/force-reset')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_alumnos)
  async forcePasswordReset(
    @GetUser('id') profesorUserId: string,
    @Param('id') alumnoId: string
  ) {
    return this.profesorService.forcePasswordReset(profesorUserId, alumnoId);
  }
}
