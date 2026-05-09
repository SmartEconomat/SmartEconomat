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
 * Servicio de dominio para auth.
 */
@Injectable()
export class AuthService {
  /**
   * Construye la instancia configurada.
   * @undefined {Repository<Usuario>} usuarioRepo - Entrada efectiva esperada por el contrato.
   * @undefined {JwtService} jwtService - Entrada efectiva esperada por el contrato.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   * @undefined {MailService} mailService - Entrada efectiva esperada por el contrato.
   */
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService
  ) {}

  /**
   * Crea register.
   *
   * @param dto Parámetro de entrada para la operación.
   */
  /**
   * Registra manejadores IPC, rutas Nest o integraciones equivalentes según contexto.
   * @undefined {RegisterUserDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ access_token: string; }>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de login dentro del flujo de la aplicación.
   *
   * @param dto Parámetro de entrada para la operación.
   */
  /**
   * Expone "login" en smart-economat-backend (Nest).
   * @undefined {LoginUserDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ requirePasswordChange: boolean; access_token: string; }>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de forgot password dentro del flujo de la aplicación.
   *
   * @param email Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
   * Ejecuta la lógica de reset password dentro del flujo de la aplicación.
   *
   * @param token Parámetro de entrada para la operación.
   * @param newPassword Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
        I18nHelper.getError('TOKEN_INVALID_OR_EXPIRED')
      );
    }

    usuario.password = newPassword;
    usuario.resetPasswordOtp = null;
    usuario.resetPasswordOtpExpires = null;
    usuario.mustChangePassword = false;

    await this.usuarioRepo.save(usuario);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "changePassword" en smart-economat-backend (Nest).
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {string} currentPassword - Entrada efectiva esperada por el contrato.
   * @undefined {string} newPassword - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
        I18nHelper.getError('CURRENT_PASSWORD_INCORRECT')
      );
    }

    usuario.password = newPassword;
    usuario.mustChangePassword = false;
    await this.usuarioRepo.save(usuario);
  }

  /**
   * Ejecuta la lógica de generate token dentro del flujo de la aplicación.
   *
   * @param usuario Parámetro de entrada para la operación.
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
