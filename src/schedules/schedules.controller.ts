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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SchedulesService } from './schedules.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { CreateHorarioDto } from './dto/create-schedule.dto';

@Controller('schedules')
@UseGuards(AuthGuard())
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
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

  @Get()
  findAll(@GetUser() user: User) {
    if (!user.empresaId) {
      throw new BadRequestException('Usuario sin empresa asignada');
    }

    return this.schedulesService.findAllByEmpresa(user.empresaId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    if (!user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa');
    }

    return this.schedulesService.findOne(id, user.empresaId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    if (!user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa');
    }

    return this.schedulesService.remove(id, user.empresaId);
  }
}
