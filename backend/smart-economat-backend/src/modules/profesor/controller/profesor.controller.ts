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
import { RequireAnyPermission } from '../../../common/decorators/require-any-permission.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Controlador REST para profesor.
 */
@Controller('profesores')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ProfesorController {
  /**
   * Construye la instancia configurada.
   * @undefined {ProfesorService} profesorService - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly profesorService: ProfesorService) {}

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Registra manejadores IPC, rutas Nest o integraciones equivalentes según contexto.
   * @undefined {CreateProfesorDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ message: string; id: string; username: string; }>} Datos efectivos después de ejecutar la operación.
   */
  @Post('register')
  @Public()
  async register(@Body() dto: CreateProfesorDto) {
    return this.profesorService.register(dto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {CreateSlotDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/profesor/profesor.entity/alumno-slot.entity").AlumnoSlot>} Datos efectivos después de ejecutar la operación.
   */
  @Post('slots')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_slots)
  async createSlot(@GetUser('id') userId: string, @Body() dto: CreateSlotDto) {
    return this.profesorService.createSlot(userId, dto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "adminCreateSlot" en smart-economat-backend (Nest).
   * @undefined {AdminCreateSlotDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/profesor/profesor.entity/alumno-slot.entity").AlumnoSlot>} Datos efectivos después de ejecutar la operación.
   */
  @Post('admin-slots')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async adminCreateSlot(@Body() dto: AdminCreateSlotDto) {
    return this.profesorService.adminCreateSlot(dto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/profesor/profesor.entity/alumno-slot.entity").AlumnoSlot[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('slots')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_slots)
  async getSlots(@GetUser('id') userId: string) {
    return this.profesorService.getSlots(userId);
  }

  /**
   * Obtiene all slots.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/profesor/profesor.entity/alumno-slot.entity").AlumnoSlot[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('all-slots')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getAllSlots() {
    return this.profesorService.getAllSlots();
  }

  /**
   * Obtiene all profesores.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {Promise<{ id: string; userId: string; username: string; nombre: string | null | undefined; email: string | null | undefined; }[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('all-profesores')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getAllProfesores() {
    return this.profesorService.getAllProfesores();
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "adminUpdateSlot" en smart-economat-backend (Nest).
   * @undefined {string} slotId - Entrada efectiva esperada por el contrato.
   * @undefined {AdminUpdateSlotDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/profesor/profesor.entity/alumno-slot.entity").AlumnoSlot>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {string} slotId - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateSlotDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/profesor/profesor.entity/alumno-slot.entity").AlumnoSlot>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Elimina o marca entidades siguendo las políticas configuradas.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {string} slotId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ message: string; }>} Datos efectivos después de ejecutar la operación.
   */
  @Delete('slots/:id')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_slots)
  async deleteSlot(@GetUser('id') userId: string, @Param('id') slotId: string) {
    return this.profesorService.deleteSlot(userId, slotId);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "adminDeleteSlot" en smart-economat-backend (Nest).
   * @undefined {string} slotId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ message: string; }>} Datos efectivos después de ejecutar la operación.
   */
  @Delete('admin-slots/:id')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async adminDeleteSlot(@Param('id') slotId: string) {
    return this.profesorService.adminDeleteSlot(slotId);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "activateAlumno" en smart-economat-backend (Nest).
   * @undefined {string} profesorUserId - Entrada efectiva esperada por el contrato.
   * @undefined {string} alumnoId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ status: import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/usuario/enums/usuario.enums").UserStatus.ACTIVE; message: string; }>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} profesorUserId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ id: string; username: string; status: import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/usuario/enums/usuario.enums").UserStatus; aula: string; numeroClase: number; }[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('alumnos')
  @RequireAnyPermission(
    PERMISSIONS.profesor.ver_alumnos,
    PERMISSIONS.profesor.gestionar_slots
  )
  async getAlumnos(@GetUser('id') profesorUserId: string) {
    return this.profesorService.getAlumnos(profesorUserId);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "forcePasswordReset" en smart-economat-backend (Nest).
   * @undefined {string} profesorUserId - Entrada efectiva esperada por el contrato.
   * @undefined {string} alumnoId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ message: string; provisionalPassword: string; mustChangePassword: boolean; }>} Datos efectivos después de ejecutar la operación.
   */
  @Post('alumnos/:id/force-reset')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_alumnos)
  async forcePasswordReset(
    @GetUser('id') profesorUserId: string,
    @Param('id') alumnoId: string
  ) {
    return this.profesorService.forcePasswordReset(profesorUserId, alumnoId);
  }

  @Delete('alumnos/:id')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_alumnos)
  async removeStudent(
    @GetUser('id') profesorUserId: string,
    @Param('id') alumnoId: string
  ) {
    return this.profesorService.removeStudent(profesorUserId, alumnoId);
  }
}
