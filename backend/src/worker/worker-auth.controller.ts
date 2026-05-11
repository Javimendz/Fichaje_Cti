// src/worker/worker-auth.controller.ts

import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Put, ForbiddenException } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { LoginPinDto } from './dto/login-pin.dto';
import { LoginMasterDto } from './dto/login-master.dto';
import { MasterPinGenerationDto } from './dto/master-pin.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('worker-auth')
export class WorkerAuthController {
  constructor(private readonly workerService: WorkerService) {}

  // --- 1. LOGIN DE CONFIGURACIÓN (Acceso a zona privada de la empresa) ---
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @Post('company-config-login')
  async companyLogin(@Body() dto: { empresaId: number; password: string }) {
    // Este genera el token de "Modo Configuración"
    return await this.workerService.loginCompanyConfig(dto);
  }

  // --- 2. ACTIVAR TRABAJADOR (Dentro de la zona privada) ---
  @UseGuards(JwtAuthGuard) // 🚩 ¡OBLIGATORIO! Para que funcione @GetUser
  @Post('activate-pin')
  async activatePin(
    @Body('dni') dni: string,
    @GetUser() user: UserPayload 
  ) {
    // Usamos el empresaId que viene en el Token del paso 1
    return await this.workerService.activateWorkerPin(dni, user.empresaId);
  }

  // --- 3. LOGIN POR PIN (Para el trabajador en el móvil) ---
  @UseGuards(ThrottlerGuard)
  @Post('login-pin')
  async loginWithPin(@Body() loginData: LoginPinDto) {
    return await this.workerService.loginWithOnlyPin(loginData);
  }

  @UseGuards(JwtAuthGuard) // Solo usuarios autenticados
@Put('regenerate-pin') // Usamos PATCH porque estamos actualizando un recurso
async regeneratePin(
  @Body() dto: { dni: string },
  @GetUser() user: UserPayload 
) {
  // 1. Validamos que el que hace la petición tenga un empresaId (venga del modo config o sea Admin)
  if (!user.empresaId) {
    throw new ForbiddenException('No tienes permisos para regenerar pines de esta empresa');
  }

  // 2. Llamamos al servicio pasando el DNI y el empresaId del token
  // Esto garantiza que un Admin de la Empresa A no pueda cambiar el PIN de alguien de la Empresa B
return await this.workerService.regeneratePinWithToken(dto.dni, user);}
}