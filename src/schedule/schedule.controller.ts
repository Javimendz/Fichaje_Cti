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

@Controller('schedules')
@UseGuards(AuthGuard())
export class ScheduleController {
  constructor(
    private readonly schedulesService: ScheduleService,
  ) {}

  @Post()
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

  @Get('get')
  findAll(@GetUser() user: User) {
    if (!user.empresaId) {
      throw new BadRequestException('Usuario sin empresa asignada');
    }

    return this.schedulesService.findAllByEmpresa(user.empresaId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ) {
    if (!user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa');
    }

    return this.schedulesService.findOne(id, user.empresaId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ) {
    if (!user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa');
    }

    return this.schedulesService.remove(id, user.empresaId);
  }
}
