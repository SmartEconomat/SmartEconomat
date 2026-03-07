import { Body, Controller, Post, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { AlumnoService } from '../service/alumno.service';
import { RegisterAlumnoDto } from '../dto/register-alumno.dto';
import { ChangeProfesorDto } from '../dto/change-profesor.dto';
@Controller('alumnos')
export class AlumnoController {
  constructor(private readonly alumnoService: AlumnoService) {}

  @Post('register')
  async register(@Body() dto: RegisterAlumnoDto) {
    return this.alumnoService.register(dto);
  }

  @Patch('change-profesor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(rolUsuario.ALUMNO)
  async changeProfesor(
    @GetUser() user: Usuario,
    @Body() dto: ChangeProfesorDto
  ) {
    return this.alumnoService.changeProfesor(user.id, user.id, user.rol, dto);
  }
}
