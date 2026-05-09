import { Module } from '@nestjs/common';
import { SherlockAuthModule } from '../../sherlock-auth/module/sherlock-auth.module';

/** Clase pública (AuthModule). Paquete: smart-economat-backend (Nest). */
@Module({
  imports: [SherlockAuthModule],
  exports: [SherlockAuthModule],
})
export class AuthModule {}
