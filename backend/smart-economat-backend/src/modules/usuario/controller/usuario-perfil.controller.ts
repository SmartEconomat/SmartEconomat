import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { UsuarioService } from '../service/usuario.service';
import { UpdateSelfPerfilDto } from '../dto/update-self-perfil.dto';
import { UpdateMisUbicacionesDto } from '../dto/update-mis-ubicaciones.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { PerfilResponseDto } from '../dto/perfil-response.dto';

/**
 * Endpoints de auto-servicio: el usuario autenticado gestiona su propio perfil.
 * Separado de UsuarioController (CRUD admin) para reducir la superficie por controlador
 * y clarificar responsabilidades.
 */
@ApiTags('Perfil de usuario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('usuarios/perfil')
export class UsuarioPerfilController {
  constructor(private readonly usuarioService: UsuarioService) {}

  /** Perfil completo del usuario autenticado (sin campos sensibles). */
  @Get()
  @ApiOperation({ summary: 'Obtener perfil propio con permisos efectivos' })
  async getPerfil(@GetUser('id') id: string): Promise<PerfilResponseDto> {
    const usuario = await this.usuarioService.findOne(id);
    const permisos = await this.usuarioService.getUserPermissions(id);

    const {
      password,
      resetPasswordOtp,
      resetPasswordOtpExpires,
      deletedAt,
      deletedBy,
      ...safeUsuario
    } = usuario as unknown as Record<string, unknown>;
    void password;
    void resetPasswordOtp;
    void resetPasswordOtpExpires;
    void deletedAt;
    void deletedBy;

    return { ...safeUsuario, permisos } as PerfilResponseDto;
  }

  /** Catálogo mínimo de ubicaciones para enlazar con la cuenta del usuario. */
  @Get('catalogo-ubicaciones')
  @ApiOperation({ summary: 'Catálogo de ubicaciones para enlace de perfil' })
  getCatalogoUbicacionesParaPerfil() {
    return this.usuarioService.findCatalogoUbicacionesParaEnlaces();
  }

  /** Actualiza datos del propio perfil (nombre, email, idioma). */
  @Patch()
  @ApiOperation({ summary: 'Actualizar datos del propio perfil' })
  updatePerfil(@GetUser('id') id: string, @Body() dto: UpdateSelfPerfilDto) {
    return this.usuarioService.update(id, dto);
  }

  /** Actualiza los vínculos usuario↔ubicación del propio usuario. */
  @Patch('mis-ubicaciones')
  @ApiOperation({ summary: 'Actualizar mis ubicaciones vinculadas' })
  updateMisUbicaciones(
    @GetUser('id') id: string,
    @Body() dto: UpdateMisUbicacionesDto
  ) {
    return this.usuarioService.updateMisUbicaciones(id, dto);
  }

  /** Actualiza preferencias de UI del propio usuario. */
  @Patch('preferences')
  @ApiOperation({ summary: 'Actualizar preferencias de UI' })
  updatePreferences(
    @GetUser('id') id: string,
    @Body() preferences: Record<string, unknown>
  ) {
    return this.usuarioService.updatePreferences(id, preferences);
  }

  /** Cambia la contraseña del usuario autenticado (requiere contraseña actual). */
  @Patch('password')
  @ApiOperation({ summary: 'Cambiar contraseña propia' })
  changePassword(@GetUser('id') id: string, @Body() dto: ChangePasswordDto) {
    return this.usuarioService.changePassword(id, dto);
  }
}
