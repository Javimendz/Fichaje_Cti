import { Controller, Post, Get, Body, Patch, UseGuards, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { JornadasService } from './jornada.service';
import { CheckInDto } from './dto/check-in.dto';
import { User } from 'auth/entities/user.entity';
import { GetUser } from 'auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';

@Controller('jornadas')
@UseGuards(JwtAuthGuard)
export class JornadaController {
  constructor(private readonly jornadasService: JornadasService) {}

  // 1. Iniciar Jornada (POST /jornadas/check-in)
  @Post('check-in')
  async create(
    @Body() checkInDto: CheckInDto, 
    @GetUser() usuario: User
  ) {
    return this.jornadasService.checkIn(checkInDto, usuario);
  }

  // 2. Finalizar Jornada (PATCH /jornadas/check-out)
  @Patch('check-out')
  async update(@GetUser() usuario: User) {
    return this.jornadasService.checkOut(usuario);
  }

  // 3. Ver Estado Actual (GET /jornadas/status)
  // Útil para que el frontend decida qué botón mostrar
  @Get('status')
  async getStatus(@GetUser() usuario: User) {
    const activa = await this.jornadasService.findActiveJornada(usuario.id);
    return {
      isWorking: !!activa,
      jornada: activa
    };
  }

  // 4. Ver Mi Historial (GET /jornadas/historial)
  @Get('historial')
  async getMyHistory(@GetUser() usuario: User) {
    return this.jornadasService.getHistorial(usuario.id);
  }

  // 5. Ver Historial por Rango (GET /jornadas/rango?desde=...&hasta=...)
  @Get('rango')
  async getByRange(
    @GetUser() usuario: User,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.jornadasService.findAllByRange(
      usuario.id, 
      new Date(desde), 
      new Date(hasta)
    );
  }
}