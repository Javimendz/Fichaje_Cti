import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SendPinDto } from './dto/send-pin.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter;

  constructor() {

    
    // Configuración del servidor SMTP usando variables de entorno (.env)
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
port: parseInt(process.env.MAIL_PORT || '2525', 10),
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendWorkerPin(data: SendPinDto) {
    const { email, nombre, pin, esNuevoPin = false } = data;
    const asunto = esNuevoPin 
      ? '🔄 Tu nuevo PIN de seguridad - Fichaje CTI' 
      : '🎉 Bienvenido - Tu PIN de acceso a Fichaje CTI';

    const saludo = esNuevoPin 
      ? `Hola ${nombre}, se ha generado un nuevo PIN de acceso a tu solicitud.` 
      : `¡Bienvenido a la plataforma, ${nombre}! Te han dado de alta como trabajador.`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #00bcd4; text-align: center;">Fichaje CTI</h2>
        <p>${saludo}</p>
        <p>A partir de ahora, puedes usar el siguiente código PIN para registrar tus jornadas:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #f4f4f9; padding: 10px 20px; border-radius: 5px; border: 1px dashed #00bcd4; color: #333;">
            ${pin}
          </span>
        </div>
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
          Por seguridad, no compartas este PIN con nadie.<br>
          Si no has solicitado este código, ponte en contacto con tu administrador.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Fichaje CTI" <${process.env.MAIL_FROM || 'no-reply@cticontrol.com'}>`,
        to: email,
        subject: asunto,
        html: htmlContent,
      });
      this.logger.log(`📧 Correo con PIN enviado con éxito a ${email}`);
    } catch (error: any) {
      this.logger.error(`Error al enviar correo a ${email}: ${error.message}`);
      throw new InternalServerErrorException('No se pudo enviar el correo con el PIN.');
    }
  }
}