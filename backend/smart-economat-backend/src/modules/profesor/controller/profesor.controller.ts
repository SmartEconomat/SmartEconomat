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
 * Controller that exposes endpoints for professor registration, classroom slot
 * management, and student administration. Public registration is available without
 * authentication; all other routes require JWT authentication and specific permissions.
 *
 * @class ProfesorController
 */
@Controller('profesores')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ProfesorController {
  constructor(private readonly profesorService: ProfesorService) {}

  /**
   * Registers a new professor account. Publicly accessible — no authentication required.
   *
   * @param {CreateProfesorDto} dto - DTO containing username, email, password and CIAL.
   * @returns {Promise<{ message: string; id: string; username: string }>} Registration confirmation.
   * @throws {ConflictException} When the username, email or CIAL already exists.
   */
  @Post('register')
  @Public()
  async register(@Body() dto: CreateProfesorDto) {
    return this.profesorService.register(dto);
  }

  /**
   * Creates a new classroom slot for the authenticated professor.
   *
   * @param {string} userId - ID of the authenticated professor (extracted from JWT).
   * @param {CreateSlotDto} dto - Slot details: aula, numeroClase, capacidad, optional ubicacionId.
   * @returns {Promise<AlumnoSlot>} The newly created slot entity.
   * @throws {NotFoundException} When no professor profile exists for the authenticated user.
   * @throws {ConflictException} When an identical aula/numeroClase slot already exists.
   */
  @Post('slots')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_slots)
  async createSlot(@GetUser('id') userId: string, @Body() dto: CreateSlotDto) {
    return this.profesorService.createSlot(userId, dto);
  }

  /**
   * Admin: creates a classroom slot for any professor by their ID.
   *
   * @param {AdminCreateSlotDto} dto - DTO including profesorId and slot details.
   * @returns {Promise<AlumnoSlot>} The newly created slot entity.
   * @throws {NotFoundException} When the specified professor does not exist.
   * @throws {ConflictException} When an identical aula/numeroClase slot already exists.
   */
  @Post('admin-slots')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async adminCreateSlot(@Body() dto: AdminCreateSlotDto) {
    return this.profesorService.adminCreateSlot(dto);
  }

  /**
   * Returns all classroom slots belonging to the authenticated professor.
   *
   * @param {string} userId - ID of the authenticated professor (extracted from JWT).
   * @returns {Promise<AlumnoSlot[]>} Slots ordered by aula and numeroClase, with enrolled students and location.
   * @throws {NotFoundException} When no professor profile exists for the authenticated user.
   */
  @Get('slots')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_slots)
  async getSlots(@GetUser('id') userId: string) {
    return this.profesorService.getSlots(userId);
  }

  /**
   * Admin: returns all classroom slots across all professors.
   *
   * @returns {Promise<AlumnoSlot[]>} All slots with full professor, student and location relations.
   */
  @Get('all-slots')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getAllSlots() {
    return this.profesorService.getAllSlots();
  }

  /**
   * Admin: returns a summary list of all professors for use in selectors.
   *
   * @returns {Promise<Array<{ id: string; userId: string; username: string; nombre: string; email: string }>>}
   *   Professor summaries ordered by username.
   */
  @Get('all-profesores')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async getAllProfesores() {
    return this.profesorService.getAllProfesores();
  }

  /**
   * Admin: updates any classroom slot, including reassigning it to a different professor.
   *
   * @param {string} slotId - UUID of the slot to update.
   * @param {AdminUpdateSlotDto} dto - Fields to update (aula, numeroClase, capacidad, ubicacionId, profesorId).
   * @returns {Promise<AlumnoSlot>} The updated slot entity.
   * @throws {NotFoundException} When the slot or the new professor are not found.
   * @throws {ConflictException} When the new aula/numeroClase combination already exists for that professor.
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
   * Updates a classroom slot owned by the authenticated professor.
   *
   * @param {string} userId - ID of the authenticated professor (extracted from JWT).
   * @param {string} slotId - UUID of the slot to update.
   * @param {UpdateSlotDto} dto - Partial slot fields to update.
   * @returns {Promise<AlumnoSlot>} The updated slot entity.
   * @throws {NotFoundException} When the professor profile or the slot are not found.
   * @throws {ConflictException} When the new aula/numeroClase combination already exists.
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
   * Deletes a classroom slot owned by the authenticated professor.
   *
   * @param {string} userId - ID of the authenticated professor (extracted from JWT).
   * @param {string} slotId - UUID of the slot to delete.
   * @returns {Promise<{ message: string }>} Success confirmation message.
   * @throws {NotFoundException} When the professor profile or the slot are not found.
   * @throws {ConflictException} When the slot has enrolled students.
   */
  @Delete('slots/:id')
  @RequirePermissions(PERMISSIONS.profesor.gestionar_slots)
  async deleteSlot(@GetUser('id') userId: string, @Param('id') slotId: string) {
    return this.profesorService.deleteSlot(userId, slotId);
  }

  /**
   * Admin: deletes any classroom slot regardless of which professor owns it.
   *
   * @param {string} slotId - UUID of the slot to delete.
   * @returns {Promise<{ message: string }>} Success confirmation message.
   * @throws {NotFoundException} When the slot is not found.
   * @throws {ConflictException} When the slot has enrolled students.
   */
  @Delete('admin-slots/:id')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async adminDeleteSlot(@Param('id') slotId: string) {
    return this.profesorService.adminDeleteSlot(slotId);
  }

  /**
   * Activates a student account enrolled in one of the professor's slots.
   *
   * @param {string} profesorUserId - ID of the authenticated professor (extracted from JWT).
   * @param {string} alumnoId - UUID of the Alumno to activate.
   * @returns {Promise<{ status: UserStatus; message: string }>} Updated account status and confirmation.
   * @throws {NotFoundException} When the professor profile or the student are not found.
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
   * Returns a summary of all students enrolled in the professor's slots.
   *
   * @param {string} profesorUserId - ID of the authenticated professor (extracted from JWT).
   * @returns {Promise<Array<{ id: string; username: string; status: UserStatus; aula: string; numeroClase: number }>>}
   *   Flattened student summaries.
   * @throws {NotFoundException} When no professor profile exists for the authenticated user.
   */
  @Get('alumnos')
  @RequirePermissions(PERMISSIONS.profesor.ver_alumnos)
  async getAlumnos(@GetUser('id') profesorUserId: string) {
    return this.profesorService.getAlumnos(profesorUserId);
  }

  /**
   * Forces a password reset for a student enrolled in one of the professor's slots.
   * Returns a provisional plain-text password that the student must change on next login.
   *
   * @param {string} profesorUserId - ID of the authenticated professor (extracted from JWT).
   * @param {string} alumnoId - UUID of the Alumno whose password should be reset.
   * @returns {Promise<{ message: string; provisionalPassword: string; mustChangePassword: true }>}
   *   Confirmation with the provisional password (one-time plain-text delivery).
   * @throws {BadRequestException} When alumnoId is missing or invalid.
   * @throws {NotFoundException} When the professor profile or the student are not found.
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
