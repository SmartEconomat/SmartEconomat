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
 * Controller that exposes authentication endpoints for user registration,
 * login, logout, profile retrieval, and password management.
 *
 * @class AuthController
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user account.
   * This endpoint is publicly accessible (no authentication required).
   *
   * @param {RegisterUserDto} registerUserDto - DTO containing the new user's registration data.
   * @returns {Promise<{ access_token: string }>} A JWT access token for the newly created user.
   * @throws {ConflictException} When username or email already exists.
   */
  @Public()
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  /**
   * Authenticates a user and returns a JWT access token.
   * Clears any existing access_token cookie before issuing a new one via CookieInterceptor.
   * This endpoint is publicly accessible (no authentication required).
   *
   * @param {LoginUserDto} loginUserDto - DTO containing login credentials (email/username and password).
   * @param {ExpressResponse} res - Express response object used to clear the cookie.
   * @returns {Promise<{ access_token: string; requirePasswordChange: boolean }>} JWT token and password change flag.
   * @throws {BadRequestException} When credentials are invalid or the account is inactive/blocked.
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
   * Logs the user out by clearing the access_token cookie.
   * This endpoint is publicly accessible (no authentication required).
   *
   * @param {ExpressResponse} res - Express response object used to clear the cookie.
   * @returns {{ message: string }} A success message confirming the logout.
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Response({ passthrough: true }) res: ExpressResponse) {
    res.clearCookie('access_token');
    return { message: I18nHelper.getSuccess('LOGOUT_SUCCESS') };
  }

  /**
   * Returns the authenticated user's profile information extracted from the JWT payload.
   * Requires a valid JWT (JwtAuthGuard).
   *
   * @param {{ user: { id: string; username: string; rol: string } }} req - Express request with attached JWT user.
   * @returns {{ id: string; username: string; rol: string }} The authenticated user's profile.
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(
    @Request() req: { user: { id: string; username: string; rol: string } }
  ) {
    return req.user;
  }

  /**
   * Changes the authenticated user's password after verifying the current password.
   * Requires a valid JWT (JwtAuthGuard).
   *
   * @param {{ user: { id: string } }} req - Express request with attached JWT user.
   * @param {ChangePasswordDto} dto - DTO containing the current and new passwords.
   * @returns {Promise<{ message: string }>} A success message confirming the password change.
   * @throws {BadRequestException} When the current password is incorrect.
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
   * Initiates the password reset flow by sending a reset link to the provided email.
   * Silently succeeds even if the email is not registered to prevent user enumeration.
   * This endpoint is publicly accessible (no authentication required).
   *
   * @param {ForgotPasswordDto} dto - DTO containing the email address.
   * @returns {Promise<{ success: boolean; message: string }>} A success response indicating the email was sent (if applicable).
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
   * Resets the user's password using a valid, non-expired reset token received via email.
   * This endpoint is publicly accessible (no authentication required).
   *
   * @param {ResetPasswordDto} dto - DTO containing the reset token and the new password.
   * @returns {Promise<{ message: string }>} A success message confirming the password was reset.
   * @throws {BadRequestException} When the token is invalid or has expired.
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: I18nHelper.getSuccess('PASSWORD_RESET') };
  }
}
