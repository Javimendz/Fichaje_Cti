// src/ausencias/ausencia.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CreateAusenciaDto } from './dto/create-ausencia.dto';
import { UpdateAusenciaDto } from './dto/update-ausencia.dto';
import { AusenciasService } from './ausencia.service';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { GetUser } from 'auth/decorators/get-user.decorator';
import { User } from 'auth/entities/user.entity';

//Falta implementar Ausencias para el admin

@Controller('ausencia')
@UseGuards(JwtAuthGuard) // Protegemos el endpoint
export class AusenciaController {
  constructor(private readonly ausenciaService: AusenciasService) {}

  @Post()
  create(
    @Body() createAusenciaDto: CreateAusenciaDto, 
    @GetUser() user: User 
  ) {
    return this.ausenciaService.create(createAusenciaDto, user);
  }

  @Get('mis-ausencias')
  findMyAusencias(@GetUser() user: User) {
    return this.ausenciaService.findAllByUsuario(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.ausenciaService.findOne(id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.ausenciaService.remove(id, user);
  }
}