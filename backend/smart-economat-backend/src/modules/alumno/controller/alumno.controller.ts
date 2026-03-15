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
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { AlumnoService } from '../service/alumno.service';
import { RegisterAlumnoDto } from '../dto/register-alumno.dto';
import { ChangeProfesorDto } from '../dto/change-profesor.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
@Controller('alumnos')
export class AlumnoController {
  constructor(private readonly alumnoService: AlumnoService) {}

  @Post('register')
  @Public()
  async register(@Body() dto: RegisterAlumnoDto) {
    return this.alumnoService.register(dto);
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
  @RequirePermissions('alumno:cambiar_profesor')
  async changeProfesor(
    @GetUser() user: Usuario,
    @Body() dto: ChangeProfesorDto
  ) {
    return this.alumnoService.changeProfesor(user.id, user.id, user.rol, dto);
  }
}
