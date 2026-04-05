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
@Controller('alumnos')
export class AlumnoController {
  constructor(private readonly alumnoService: AlumnoService) {}

  @Post('register')
  @Public()
  async register(@Body() dto: RegisterAlumnoDto) {
    return this.alumnoService.register(dto);
  }

  @Get('slots/:codigoClase')
  @Public()
  async getSlotByCode(@Param('codigoClase') codigoClase: string) {
    return this.alumnoService.getSlotByCode(codigoClase);
  }

  @Get('aulas')
  @Public()
  async getAulas() {
    return this.alumnoService.getAulas();
  }

  @Get('aulas/:aula/clases')
  @Public()
  async getClasesByAula(@Param('aula') aula: string) {
    return this.alumnoService.getClasesByAula(aula);
  }

  @Get('aulas/:aula/clases/:clase/profesores')
  @Public()
  async getProfesoresBySlot(
    @Param('aula') aula: string,
    @Param('clase') clase: string
  ) {
    return this.alumnoService.getProfesoresBySlot(aula, parseInt(clase));
  }

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
