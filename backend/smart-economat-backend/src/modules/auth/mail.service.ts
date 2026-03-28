import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { I18nHelper } from '../../common/helpers/i18n.helper';

const PASSWORD_RESET_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:40px 0">
    <tr>
      <td align="center" style="padding:0 16px">

        <!-- Contenedor principal -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10)">

          <!-- Cabecera -->
          <tr>
            <td style="background-color:#dc004e;padding:32px 40px;text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:bold;letter-spacing:1px;line-height:1.2">SmartEconomat</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:0.5px">Sistema de gestión de economato</p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:40px 40px 32px">
              <h2 style="margin:0 0 20px;color:#212121;font-size:22px;font-weight:bold;line-height:1.3">Reset Password</h2>
              <p style="margin:0 0 16px;color:#424242;font-size:15px;line-height:1.7">
                Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para continuar:
              </p>

              <!-- Botón CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{RESET_URL}}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="12%" stroke="f" fillcolor="#dc004e">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Restablecer contraseña</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="{{RESET_URL}}"
                       target="_blank"
                       style="display:inline-block;background-color:#dc004e;color:#ffffff;padding:14px 36px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;letter-spacing:0.5px;line-height:1;mso-hide:all">
                      Restablecer contraseña
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Enlace de respaldo -->
              <p style="margin:0 0 8px;color:#757575;font-size:13px;line-height:1.5">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;word-break:break-all">
                <a href="{{RESET_URL}}" style="color:#0a6151;text-decoration:underline">{{RESET_URL}}</a>
              </p>
            </td>
          </tr>

          <!-- Separador -->
          <tr>
            <td style="padding:0 40px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #eeeeee;font-size:0;line-height:0">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Nota de validez -->
          <tr>
            <td style="padding:24px 40px">
              <p style="margin:0;color:#757575;font-size:13px;line-height:1.6">
                <strong style="color:#424242">Este enlace es válido 1 hora.</strong>
                Si no solicitaste este cambio, puedes ignorar este correo de forma segura — tu contraseña no se modificará.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f5f5;padding:20px 40px;text-align:center;border-radius:0 0 8px 8px">
              <p style="margin:0;color:#9e9e9e;font-size:12px;line-height:1.5">
                &copy; SmartEconomat &mdash; Sistema de gestión de economato
              </p>
              <p style="margin:6px 0 0;color:#bdbdbd;font-size:11px">
                Este es un mensaje automático, por favor no respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Contenedor principal -->

      </td>
    </tr>
  </table>
</body>
</html>`;

const PASSWORD_RESET_TEXT = `Reset Password - SmartEconomat
================================

Has solicitado restablecer tu contraseña. Haz clic en el enlace de abajo para continuar:

{{RESET_URL}}

Este enlace es válido 1 hora.

Si no solicitaste este cambio, puedes ignorar este correo de forma segura — tu contraseña no se modificará.

---
SmartEconomat — Sistema de gestión de economato
Este es un mensaje automático, por favor no respondas a este correo.`;

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
      this.logger.warn('SMTP no configurado — modo simulación');
      this.logger.log(`To: ${email} | Link: ${recoveryLink}`);
      return;
    }

    const from = process.env.MAIL_FROM || process.env.MAIL_USER;

    try {
      await transporter.sendMail({
        from: `"SmartEconomat" <${from}>`,
        to: email,
        subject: 'Recuperación de contraseña - SmartEconomat',
        html: PASSWORD_RESET_HTML.replaceAll('{{RESET_URL}}', recoveryLink),
        text: PASSWORD_RESET_TEXT.replaceAll('{{RESET_URL}}', recoveryLink),
      });
    } catch (error) {
      this.logger.error('Fallo SMTP al enviar correo de recuperación', error);
      throw new InternalServerErrorException(
        I18nHelper.getError('EMAIL_SEND_FAILED')
      );
    }
  }
}
