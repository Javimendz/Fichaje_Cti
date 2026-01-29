// src/ausencias/ausencia.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CreateAusenciaDto } from './dto/create-ausencia.dto';
import { UpdateAusenciaDto } from './dto/update-ausencia.dto';
import { AusenciasService } from './ausencia.service';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { GetUser } from 'auth/decorators/get-user.decorator';
import { User } from 'auth/entities/user.entity';
import { AusenciaEstado } from './entities/ausencia.entity';

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
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.ausenciaService.findOne(id, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.ausenciaService.remove(id, user);
  }

@Patch(':id/estado')
async updateEstado(
  @Param('id', ParseIntPipe) id: number,
  @Body('estado') estado: AusenciaEstado, // Asegúrate de importar AusenciaEstado
  @GetUser() admin: User 
) {
  console.log('--- ENTRANDO AL CONTROLADOR ---');
  console.log('ID Ausencia:', id);
  console.log('Nuevo Estado:', estado);
  console.log('Admin que procesa:', admin.nombre);

  return this.ausenciaService.updateEstado(id, estado, admin);
}
}