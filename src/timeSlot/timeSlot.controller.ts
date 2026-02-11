import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  ParseUUIDPipe, UseGuards, 
  ParseIntPipe,
  Put
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { TimeSlotService } from './timeSlot.service';
import { CreateTimeSlotDto } from './dto/create-timeSlot.dto';
import { UpdateTimeSlotDto } from './dto/update-timeSlot.dto';

@Controller('franja-horaria')
@UseGuards(AuthGuard()) // 
export class TimeSlotController {
  constructor(private readonly franjaHorariaService: TimeSlotService) {}

  @Post()
  create(@Body() createFranjaHorariaDto: CreateTimeSlotDto) {
    // Nota: El servicio ya valida que el distribucionDiaId sea válido
    return this.franjaHorariaService.create(createFranjaHorariaDto);
  }

  @Get('list-franja-horaria')
  findAll() {
    return this.franjaHorariaService.findAll();
  }

  @Get('find/:id')
  findOne(@Param('id', ParseIntPipe) id: number) { 
    return this.franjaHorariaService.findOne(id);
  }

  @Put('update/:id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateFranjaHorariaDto: UpdateTimeSlotDto
  ) {
    return this.franjaHorariaService.update(id, updateFranjaHorariaDto);
  }

  @Delete('delete/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.franjaHorariaService.remove(id);
  }
}