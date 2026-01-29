import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  ParseUUIDPipe, UseGuards, 
  ParseIntPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { FranjasHorariasService } from './franja-horaria.service';
import { CreateFranjaHorariaDto } from './dto/create-franja-horaria.dto';
import { UpdateFranjaHorariaDto } from './dto/update-franja-horaria.dto';

@Controller('franja-horaria')
@UseGuards(AuthGuard()) // 
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
  findOne(@Param('id', ParseIntPipe) id: number) { 
    return this.franjaHorariaService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateFranjaHorariaDto: UpdateFranjaHorariaDto
  ) {
    return this.franjaHorariaService.update(id, updateFranjaHorariaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.franjaHorariaService.remove(id);
  }
}