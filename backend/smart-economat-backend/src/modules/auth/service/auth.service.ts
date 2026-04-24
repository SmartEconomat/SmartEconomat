import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { rolUsuario, UserStatus } from '../../usuario/enums/usuario.enums';
import { MailService } from '../mail.service';
import * as crypto from 'crypto';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { getRolPrincipal } from '../../sherlock-auth/utils/access.utils';

/**
 * Service responsible for authentication operations including user registration,
 * login, password management, and JWT token generation.
 *
 * @class AuthService
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService
  ) {}

  /**
   * Registers a new user account within a database transaction.
   * Assigns the ALUMNO role by default and creates the account in INACTIVE status.
   *
   * @param {RegisterUserDto} dto - Data transfer object containing registration details.
   * @returns {Promise<{ access_token: string }>} A JWT access token for the new user.
   * @throws {ConflictException} When a user with the same username or email already exists.
   */
  async register(dto: RegisterUserDto) {
    return await this.dataSource.transaction(async (manager) => {
      const whereConditions: any[] = [{ username: dto.username }];
      if (dto.email) {
        whereConditions.push({ email: dto.email });
      }

      const existing = await manager.findOne(Usuario, {
        where: whereConditions,
      });

      if (existing) {
        throw new ConflictException(
          I18nHelper.getError('USER_OR_EMAIL_ALREADY_REGISTERED')
        );
      }

      const alumnoRole = await manager.findOne(Rol, {
        where: { nombre: rolUsuario.ALUMNO },
      });

      const usuario = manager.create(Usuario, {
        ...dto,
        status: UserStatus.INACTIVE,
        rol: rolUsuario.ALUMNO,
        roles: alumnoRole ? [alumnoRole] : [],
      });

      await manager.save(usuario);
      return this.generateToken(usuario);
    });
  }

  /**
   * Authenticates a user by validating their credentials and returning a JWT token.
   * Supports login by either email or username.
   *
   * @param {LoginUserDto} dto - Data transfer object containing login credentials.
   * @returns {Promise<{ access_token: string; requirePasswordChange: boolean }>} JWT token and password change flag.
   * @throws {BadRequestException} When credentials are invalid.
   * @throws {BadRequestException} When the account is inactive.
   * @throws {BadRequestException} When the account is blocked.
   */
  async login(dto: LoginUserDto) {
    const usuario = await this.usuarioRepo
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.roles', 'roles')
      .where('(usuario.email = :email OR usuario.username = :email)', {
        email: dto.email,
      })
      .addSelect('usuario.password')
      .getOne();

    if (!usuario || !(await bcrypt.compare(dto.password, usuario.password))) {
      throw new BadRequestException(I18nHelper.getError('INVALID_CREDENTIALS'));
    }

    if (usuario.status === UserStatus.INACTIVE) {
      throw new BadRequestException(I18nHelper.getError('ACCOUNT_INACTIVE'));
    }

    if (usuario.status === UserStatus.BLOCKED) {
      throw new BadRequestException(I18nHelper.getError('ACCOUNT_BLOCKED'));
    }

    const tokenData = this.generateToken(usuario);
    return {
      ...tokenData,
      requirePasswordChange: usuario.mustChangePassword,
    };
  }

  /**
   * Initiates a password reset flow by generating a secure token and sending a reset email.
   * Silently returns if the email is not found to prevent user enumeration.
   *
   * @param {string} email - The email address of the account to reset.
   * @returns {Promise<void>}
   */
  async forgotPassword(email: string): Promise<void> {
    if (!email) return;

    const usuario = await this.usuarioRepo.findOne({ where: { email } });
    if (!usuario) return;

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    usuario.resetPasswordOtp = hashedToken;
    usuario.resetPasswordOtpExpires = new Date(Date.now() + 60 * 60 * 1000);
    await this.usuarioRepo.save(usuario);

    if (usuario.email) {
      await this.mailService.sendPasswordResetEmail(usuario.email, token);
    }
  }

  /**
   * Resets the user's password using a valid, non-expired reset token.
   *
   * @param {string} token - The plain-text reset token received via email.
   * @param {string} newPassword - The new password to set for the user.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the token is invalid or has expired.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const usuario = await this.usuarioRepo.findOne({
      where: { resetPasswordOtp: hashedToken },
      select: ['id', 'resetPasswordOtp', 'resetPasswordOtpExpires'],
    });

    if (
      !usuario ||
      !usuario.resetPasswordOtpExpires ||
      usuario.resetPasswordOtpExpires < new Date()
    ) {
      throw new BadRequestException(
        I18nHelper.getError('EL_TOKEN_ES_INV_LIDO_O_HA_EXPIRADO')
      );
    }

    usuario.password = newPassword;
    usuario.resetPasswordOtp = null;
    usuario.resetPasswordOtpExpires = null;
    usuario.mustChangePassword = false;

    await this.usuarioRepo.save(usuario);
  }

  /**
   * Changes the password of an authenticated user after validating the current password.
   *
   * @param {string} userId - The ID of the authenticated user.
   * @param {string} currentPassword - The user's current password for verification.
   * @param {string} newPassword - The new password to set.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the user is not found.
   * @throws {BadRequestException} When the current password is incorrect.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const usuario = await this.usuarioRepo
      .createQueryBuilder('usuario')
      .where('usuario.id = :id', { id: userId })
      .addSelect('usuario.password')
      .getOne();

    if (!usuario) {
      throw new BadRequestException(I18nHelper.getError('USER_NOT_FOUND'));
    }

    if (!(await bcrypt.compare(currentPassword, usuario.password))) {
      throw new BadRequestException(
        I18nHelper.getError('LA_CONTRASE_A_ACTUAL_ES_INCORRECTA')
      );
    }

    usuario.password = newPassword;
    usuario.mustChangePassword = false;
    await this.usuarioRepo.save(usuario);
  }

  /**
   * Generates a signed JWT token for the given user.
   *
   * @param {Usuario} usuario - The user entity for whom the token is generated.
   * @returns {{ access_token: string }} An object containing the signed JWT access token.
   */
  private generateToken(usuario: Usuario) {
    const payload: JwtPayload = {
      sub: usuario.id,
      username: usuario.username,
      role: getRolPrincipal(usuario.roles, usuario.rol),
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
