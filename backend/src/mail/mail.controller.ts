import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendPinDto } from './dto/send-pin.dto'; // Usa el DTO que creamos
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles.enum';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  // Solo accesible por SuperAdmins para hacer pruebas de envío
  @Post('test')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPERADMIN)
  async testMail(@Body() dto: SendPinDto) {
    return await this.mailService.sendWorkerPin(dto);
  }
}