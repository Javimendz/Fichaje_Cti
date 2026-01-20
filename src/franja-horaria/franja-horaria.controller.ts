import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  ParseUUIDPipe, UseGuards 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { FranjasHorariasService } from './franja-horaria.service';
import { CreateFranjaHorariaDto } from './dto/create-franja-horaria.dto';
import { UpdateFranjaHorariaDto } from './dto/update-franja-horaria.dto';

@Controller('franja-horaria')
@UseGuards(AuthGuard()) // 👈 Obliga a estar autenticado para usar cualquier ruta
export class FranjaHorariaController {
  constructor(private readonly franjaHorariaService: FranjasHorariasService) {}

  @Post()
  create(@Body() createFranjaHorariaDto: CreateFranjaHorariaDto) {
    // Nota: El servicio ya valida que el distribucionDiaId sea válido
    return this.franjaHorariaService.create(createFranjaHorariaDto);
  }

  @Get()
  findAll() {
    return this.franjaHorariaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { // 👈 Validamos que sea un UUID
    return this.franjaHorariaService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateFranjaHorariaDto: UpdateFranjaHorariaDto
  ) {
    return this.franjaHorariaService.update(id, updateFranjaHorariaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.franjaHorariaService.remove(id);
  }
}