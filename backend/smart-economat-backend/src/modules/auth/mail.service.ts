import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
  const frontendUrl = process.env.FRONTEND_API_URL || 'http://localhost:5173';
  const recoveryLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    this.logger.log(`\n================= EMAIL SIMULATION =================`);
    this.logger.log(`To: ${email}`);
    this.logger.log(`Subject: Password Reset Request`);
    this.logger.log(
      `Body: You requested a password reset. Click here to reset your password: ${recoveryLink}`
    );
    this.logger.log(`If you did not request this, please ignore this email.`);
    this.logger.log(`====================================================\n`);

    return Promise.resolve();
  }
}
