import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Response,
  HttpCode,
  HttpStatus,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { AuthService } from '../service/auth.service';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { CookieInterceptor } from '../../../common/interceptors/cookie.interceptor';

/**
 * Controlador encargado de los procesos de autenticación y seguridad.
 * Gestiona el registro, inicio de sesión (JWT), cierre de sesión,
 * y los flujos de recuperación y cambio de contraseña.
 */
@Controller('auth')
export class AuthController {
  /**
   * Construye la instancia configurada.
   * @undefined {AuthService} authService - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Registra un nuevo usuario en el sistema.
   * @param registerUserDto Datos del nuevo usuario.
   * @returns El usuario creado.
   */
  @Public()
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  /**
   * Inicia sesión de un usuario y establece la cookie de autenticación.
   * @param loginUserDto Credenciales de acceso.
   * @param res Respuesta Express para la gestión de cookies.
   * @returns Datos de sesión y token JWT.
   */
  @Public()
  @UseInterceptors(CookieInterceptor)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Response({ passthrough: true }) res: ExpressResponse
  ) {
    res.clearCookie('access_token');
    return this.authService.login(loginUserDto);
  }

  /**
   * Cierra la sesión del usuario invalidando la cookie de autenticación.
   * @param res Respuesta Express.
   * @returns Mensaje de éxito.
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Response({ passthrough: true }) res: ExpressResponse) {
    res.clearCookie('access_token');
    return { message: I18nHelper.getSuccess('LOGOUT_SUCCESS') };
  }

  /**
   * Obtiene la información del perfil del usuario autenticado actual.
   * @param req Petición con el usuario inyectado por el guard.
   * @returns Datos básicos del usuario.
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(
    @Request() req: { user: { id: string; username: string; rol: string } }
  ) {
    return req.user;
  }

  /**
   * Permite al usuario autenticado cambiar su contraseña.
   * @param req Petición para obtener el ID del usuario.
   * @param dto Datos con la contraseña actual y la nueva.
   * @returns Mensaje de éxito.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: { user: { id: string } },
    @Body() dto: ChangePasswordDto
  ) {
    await this.authService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword
    );
    return { message: I18nHelper.getSuccess('PASSWORD_CHANGED') };
  }

  /**
   * Inicia el flujo de recuperación de contraseña olvidada.
   * Envía un correo electrónico con el token de recuperación.
   * @param dto DTO con el email del usuario.
   * @returns Confirmación de envío del correo.
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      success: true,
      message: I18nHelper.getSuccess('FORGOT_PASSWORD_EMAIL_SENT'),
    };
  }

  /**
   * Restablece la contraseña utilizando un token válido.
   * @param dto DTO con el token y la nueva contraseña.
   * @returns Mensaje de éxito.
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: I18nHelper.getSuccess('PASSWORD_RESET') };
  }
}
