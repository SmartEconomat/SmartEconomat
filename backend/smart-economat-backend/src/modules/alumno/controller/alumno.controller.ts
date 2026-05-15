import {
  Body,
  Controller,
  Post,
  Patch,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
 * Controlador REST para alumno.
 */
@Controller('alumnos')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class AlumnoController {
  /**
   * Inicializa la instancia con los colaboradores necesarios para el flujo.
   *
   * @param private readonly alumnoService Parámetro de entrada para la operación.
   */
  constructor(private readonly alumnoService: AlumnoService) {}

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Registra manejadores IPC, rutas Nest o integraciones equivalentes según contexto.
   * @undefined {RegisterAlumnoDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ id: string; username: string; status: import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/usuario/enums/usuario.enums").UserStatus; message: string; }>} Datos efectivos después de ejecutar la operación.
   */
  @Post('register')
  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterAlumnoDto) {
    return this.alumnoService.register(dto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} codigoClase - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ codigoClase: string | undefined; aula: string; numeroClase: number; profesor: string; cialProfesor: string; }>} Datos efectivos después de ejecutar la operación.
   */
  @Get('slots/:codigoClase')
  @Public()
  @Throttle({ read: { limit: 30, ttl: 60000 } })
  async getSlotByCode(@Param('codigoClase') codigoClase: string) {
    return this.alumnoService.getSlotByCode(codigoClase);
  }

  /**
   * Obtiene aulas.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {Promise<string[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('aulas')
  @Public()
  @Throttle({ read: { limit: 60, ttl: 60000 } })
  async getAulas() {
    return this.alumnoService.getAulas();
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} aula - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<number[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('aulas/:aula/clases')
  @Public()
  @Throttle({ read: { limit: 60, ttl: 60000 } })
  async getClasesByAula(@Param('aula') aula: string) {
    return this.alumnoService.getClasesByAula(aula);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} aula - Entrada efectiva esperada por el contrato.
   * @undefined {string} clase - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ cial: string; nombre: string; codigoSlot: string | undefined; }[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('aulas/:aula/clases/:clase/profesores')
  @Public()
  @Throttle({ read: { limit: 60, ttl: 60000 } })
  async getProfesoresBySlot(
    @Param('aula') aula: string,
    @Param('clase') clase: string
  ) {
    return this.alumnoService.getProfesoresBySlot(aula, parseInt(clase));
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "changeProfesor" en smart-economat-backend (Nest).
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {rolUsuario} userRole - Entrada efectiva esperada por el contrato.
   * @undefined {ChangeProfesorDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ message: string; }>} Datos efectivos después de ejecutar la operación.
   */
  @Patch('change-profesor')
  @RequirePermissions(PERMISSIONS.alumno.cambiar_profesor)
  async changeProfesor(
    @GetUser('id') userId: string,
    @GetUser('rol') userRole: rolUsuario,
    @Body() dto: ChangeProfesorDto
  ) {
    return this.alumnoService.changeProfesor(userId, userId, userRole, dto);
  }
}
