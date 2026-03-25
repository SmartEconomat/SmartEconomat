import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = process.env.MAIL_HOST;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    if (!host || !user || !pass) return null;

    const port = parseInt(process.env.MAIL_PORT || '587', 10);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    return this.transporter;
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_API_URL || 'http://localhost:5173';
    const recoveryLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const transporter = this.getTransporter();

    if (!transporter) {
      this.logger.log(`\n================= EMAIL SIMULATION =================`);
      this.logger.log(`To: ${email}`);
      this.logger.log(`Subject: Recuperación de contraseña - SmartEconomat`);
      this.logger.log(`Recovery link: ${recoveryLink}`);
      this.logger.log(`====================================================\n`);
      return;
    }

    const from =
      process.env.MAIL_FROM ||
      process.env.MAIL_USER ||
      'noreply@smarteconomat.com';

    await transporter.sendMail({
      from: `"SmartEconomat" <${from}>`,
      to: email,
      subject: 'Recuperación de contraseña - SmartEconomat',
      html: this.buildPasswordResetHtml(recoveryLink),
      text: `Has solicitado restablecer tu contraseña. Accede al siguiente enlace (válido 15 minutos): ${recoveryLink}`,
    });
  }

  private buildPasswordResetHtml(recoveryLink: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#1976d2;padding:32px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:1px">SmartEconomat</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 24px">
            <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px">Recuperación de contraseña</h2>
            <p style="margin:0 0 16px;color:#444;line-height:1.6">Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva.</p>
            <p style="margin:0 0 32px;color:#444;line-height:1.6">Este enlace es válido durante <strong>15 minutos</strong>.</p>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center">
                  <a href="${recoveryLink}" style="display:inline-block;background:#1976d2;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold">
                    Restablecer contraseña
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #eeeeee">
            <p style="margin:0 0 8px;color:#888;font-size:13px">Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no será modificada.</p>
            <p style="margin:0;color:#bbb;font-size:12px">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="margin:4px 0 0;color:#1976d2;font-size:12px;word-break:break-all">${recoveryLink}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f4f6f8;padding:20px;text-align:center">
            <p style="margin:0;color:#aaa;font-size:12px">SmartEconomat &mdash; Sistema de gestión de economato</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
