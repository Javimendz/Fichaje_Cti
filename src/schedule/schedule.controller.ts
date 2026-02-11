import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScheduleService } from './schedule.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import { User } from 'users/entities/user.entity';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';

@Controller('schedule')
@UseGuards(JwtAuthGuard) // 👈 Cambiado para usar Cookies
export class ScheduleController {
  constructor(
    private readonly schedulesService: ScheduleService,
  ) {}

  @Post('crear-schedule')
  create(
    @Body() dto: CreateHorarioDto,
    @GetUser() user: User,
  ) {
    if (!user.empresaId) {
      throw new UnauthorizedException(
        'No tienes una empresa asociada para crear horarios',
      );
    }

    return this.schedulesService.create(dto, user);
  }

  @Get('list-schedules')
  findAll(@GetUser() user: User) {
    if (!user.empresaId) {
      throw new BadRequestException('Usuario sin empresa asignada');
    }

    return this.schedulesService.findAllByEmpresa(user.empresaId);
  }

  @Get('find/:id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ) {
    if (!user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa');
    }

    return this.schedulesService.findOne(id, user.empresaId);
  }

  @Delete('delete/:id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ) {
    if (!user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa');
    }

    return this.schedulesService.remove(id, user.empresaId);
  }

  // Método privado para limpiar el código de validaciones repetitivas
  private validateEmpresa(user: User) {
    if (!user.empresaId) {
      throw new UnauthorizedException('El usuario no tiene una empresa asociada');
    }
  }

}
