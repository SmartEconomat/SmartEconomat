import {
  Body,
  Controller,
  Post,
  Patch,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { AlumnoService } from '../service/alumno.service';
import { RegisterAlumnoDto } from '../dto/register-alumno.dto';
import { ChangeProfesorDto } from '../dto/change-profesor.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Controller for student (Alumno) self-service operations.
 * Public endpoints allow unauthenticated registration and slot/classroom lookups;
 * the change-profesor endpoint requires authentication and the corresponding permission.
 * @class AlumnoController
 */
@Controller('alumnos')
export class AlumnoController {
  /**
   * @description Constructs the controller with the AlumnoService dependency.
   * @param {AlumnoService} alumnoService - Service that handles student business logic.
   */
  constructor(private readonly alumnoService: AlumnoService) {}

  /**
   * Registers a new student account. This endpoint is publicly accessible.
   * The created account will be in INACTIVE status until activated by a professor.
   * @param {RegisterAlumnoDto} dto - Registration payload (credentials, slot or class details).
   * @returns {Promise<{ id: string; username: string; status: string; message: string }>} Created account summary.
   * @throws {NotFoundException} When the referenced slot or profesor cannot be resolved.
   * @throws {BadRequestException} When the target slot is at full capacity.
   * @throws {ConflictException} When the username is already taken.
   */
  @Post('register')
  @Public()
  async register(@Body() dto: RegisterAlumnoDto) {
    return this.alumnoService.register(dto);
  }

  /**
   * Returns summary information about a class slot identified by its code.
   * This endpoint is publicly accessible to allow students to verify a slot before registering.
   * @param {string} codigoClase - Class slot code to look up.
   * @returns {Promise<{ codigoClase: string; aula: string; numeroClase: number; profesor: string; cialProfesor: string }>} Slot summary.
   * @throws {NotFoundException} When no slot matches the given code.
   */
  @Get('slots/:codigoClase')
  @Public()
  async getSlotByCode(@Param('codigoClase') codigoClase: string) {
    return this.alumnoService.getSlotByCode(codigoClase);
  }

  /**
   * Returns a sorted list of all unique classroom identifiers (aulas).
   * This endpoint is publicly accessible for use in registration forms.
   * @returns {Promise<string[]>} Sorted array of aula values.
   */
  @Get('aulas')
  @Public()
  async getAulas() {
    return this.alumnoService.getAulas();
  }

  /**
   * Returns a sorted list of class numbers available within a specific aula.
   * This endpoint is publicly accessible for use in registration forms.
   * @param {string} aula - Classroom identifier to filter by.
   * @returns {Promise<number[]>} Sorted array of numeroClase values.
   */
  @Get('aulas/:aula/clases')
  @Public()
  async getClasesByAula(@Param('aula') aula: string) {
    return this.alumnoService.getClasesByAula(aula);
  }

  /**
   * Returns the profesores that teach a specific aula/clase combination.
   * This endpoint is publicly accessible for use in registration forms.
   * @param {string} aula - Classroom identifier.
   * @param {string} clase - Class number (parsed to integer).
   * @returns {Promise<Array<{ cial: string; nombre: string; codigoSlot: string }>>} Array of profesor summaries.
   */
  @Get('aulas/:aula/clases/:clase/profesores')
  @Public()
  async getProfesoresBySlot(
    @Param('aula') aula: string,
    @Param('clase') clase: string
  ) {
    return this.alumnoService.getProfesoresBySlot(aula, parseInt(clase));
  }

  /**
   * Changes the profesor and slot assignment for the authenticated student.
   * Requires JWT authentication and the alumno.cambiar_profesor permission.
   * @param {string} userId - ID of the authenticated user (injected by GetUser decorator).
   * @param {rolUsuario} userRole - Role of the authenticated user (injected by GetUser decorator).
   * @param {ChangeProfesorDto} dto - New profesor CIAL, aula, and numeroClase.
   * @returns {Promise<{ message: string }>} Success message.
   * @throws {NotFoundException} When the alumno, new profesor, or new slot cannot be found.
   * @throws {BadRequestException} When the requester lacks permission or the new slot is full.
   */
  @Patch('change-profesor')
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequirePermissions(PERMISSIONS.alumno.cambiar_profesor)
  async changeProfesor(
    @GetUser('id') userId: string,
    @GetUser('rol') userRole: rolUsuario,
    @Body() dto: ChangeProfesorDto
  ) {
    return this.alumnoService.changeProfesor(userId, userId, userRole, dto);
  }
}
