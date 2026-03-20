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
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { AuthService } from '../service/auth.service';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Response({ passthrough: true }) res: ExpressResponse
  ) {
    res.clearCookie('access_token');
    return this.authService.login(loginUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword
    );
    return { message: 'Contraseña actualizada correctamente' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    await this.authService.forgotPassword(email);
    return {
      message:
        'Si el correo existe, se ha enviado un enlace para restablecer la contraseña',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Contraseña restablecida correctamente' };
  }
}
