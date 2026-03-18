import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CodigoAccesoService } from './codigo-acceso.service';
import { CreateCodigoAccesoDto } from './dto/create-codigo-acceso.dto';
import { UpdateCodigoAccesoDto } from './dto/update-codigo-acceso.dto';

@Controller('codigo-acceso')
export class CodigoAccesoController {
  constructor(private readonly codigoAccesoService: CodigoAccesoService) {}

  @Post()
  create(@Body() createCodigoAccesoDto: CreateCodigoAccesoDto) {
    return this.codigoAccesoService.create(createCodigoAccesoDto);
  }

  @Get()
  findAll() {
    return this.codigoAccesoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.codigoAccesoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCodigoAccesoDto: UpdateCodigoAccesoDto) {
    return this.codigoAccesoService.update(+id, updateCodigoAccesoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.codigoAccesoService.remove(+id);
  }
}
