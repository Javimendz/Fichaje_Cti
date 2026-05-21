import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SendPinDto } from './dto/send-pin.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

 constructor() {
    const host = process.env.MAIL_HOST;
    const port = parseInt(process.env.MAIL_PORT || '587', 10);
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    this.logger.log(`[SMTP INIT] Conectando a host: ${host || 'FALTA HOST'} en el puerto: ${port}`);

    if (!host || !user || !pass) {
      this.logger.error('❌ CRÍTICO: Faltan configurar variables SMTP esenciales en el .env');
    }

    this.transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465, // false para 587 (STARTTLS es mandatorio aquí)
      auth: {
        user: user,
        pass: pass,
      },
      // 🚩 CORRECCIÓN CRÍTICA: Eliminamos 'SSLv3' y permitimos negociación TLS moderna
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendWorkerPin(data: SendPinDto): Promise<void> {
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
      // 1. Aseguramos el remitente (from)
      const senderEmail = process.env.MAIL_FROM || 'no-reply@cticontrol.com';

      // 2. Validamos de forma estricta que exista un destinatario
      if (!email) {
        throw new Error('El correo electrónico del destinatario está vacío o es inválido.');
      }

      // 3. Ejecutamos el envío con los tipos garantizados como string
      await this.transporter.sendMail({
        from: `"Fichaje CTI" <${senderEmail}>`,
        to: email.trim(), // ✅ Al haber validado arriba, TS ya sabe que es un string seguro
        subject: asunto,
        html: htmlContent,
      });
      
      this.logger.log(`📧 Correo con PIN enviado con éxito a ${email}`);
    } catch (error: any) {
      this.logger.error(`Error al enviar correo a ${email || 'Destinatario Desconocido'}: ${error.message}`);
      throw new InternalServerErrorException('No se pudo enviar el correo con el PIN.');
    }
  }
}