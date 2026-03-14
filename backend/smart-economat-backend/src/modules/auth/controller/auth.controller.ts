import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../service/auth.service';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CookieInterceptor } from '../../../common/interceptors/cookie.interceptor';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseInterceptors(CookieInterceptor)
  async register(@Body() dto: RegisterUserDto) {
    return await this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(CookieInterceptor)
  async login(@Body() dto: LoginUserDto) {
    return await this.authService.login(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message: I18nHelper.translate(
        'messages.SI_EL_CORREO_EST_REGISTRADO_RECIBIR_S_UN'
      ),
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return {
      message: I18nHelper.translate(
        'messages.CONTRASE_A_RESTABLECIDA_CORRECTAMENTE'
      ),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const user = req.user as { id: string };
    await this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword
    );
    return {
      message: I18nHelper.translate(
        'messages.CONTRASE_A_CAMBIADA_CORRECTAMENTE'
      ),
    };
  }
}
