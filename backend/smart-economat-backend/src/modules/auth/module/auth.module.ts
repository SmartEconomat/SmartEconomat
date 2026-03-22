import { Module } from '@nestjs/common';
import { SherlockAuthModule } from '../../sherlock-auth/module/sherlock-auth.module';

@Module({
  imports: [SherlockAuthModule],
  exports: [SherlockAuthModule],
})
export class AuthModule {}
