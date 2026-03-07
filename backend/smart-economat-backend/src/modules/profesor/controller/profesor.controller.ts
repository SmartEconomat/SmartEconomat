import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { ProfesorService } from '../service/profesor.service';
import { CreateSlotDto } from '../dto/create-slot.dto';
import { CreateProfesorDto } from '../dto/create-profesor.dto';

@Controller('profesores')
export class ProfesorController {
  constructor(private readonly profesorService: ProfesorService) {}

  @Post('register')
  async register(@Body() dto: CreateProfesorDto) {
    return this.profesorService.register(dto);
  }

  @Post('slots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(rolUsuario.PROFESOR, rolUsuario.ADMINISTRADOR)
  async createSlot(@Request() req: any, @Body() dto: CreateSlotDto) {
    return this.profesorService.createSlot(req.user.id, dto);
  }

  @Patch('alumnos/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(rolUsuario.PROFESOR)
  async activateAlumno(@Request() req: any, @Param('id') alumnoId: string) {
    return this.profesorService.activateAlumno(req.user.id, alumnoId);
  }

  @Get('alumnos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(rolUsuario.PROFESOR)
  async getAlumnos(@Request() req: any) {
    return this.profesorService.getAlumnos(req.user.id);
  }

  @Post('alumnos/:id/force-reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(rolUsuario.PROFESOR)
  async forcePasswordReset(@Request() req: any, @Param('id') alumnoId: string) {
    return this.profesorService.forcePasswordReset(req.user.id, alumnoId);
  }
}
