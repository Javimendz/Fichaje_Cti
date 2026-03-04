import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AlgoService } from './algo.service';
import { CreateAlgoDto } from './dto/create-algo.dto';
import { UpdateAlgoDto } from './dto/update-algo.dto';

@Controller('algo')
export class AlgoController {
  constructor(private readonly algoService: AlgoService) {}

  @Post()
  create(@Body() createAlgoDto: CreateAlgoDto) {
    return this.algoService.create(createAlgoDto);
  }

  @Get()
  findAll() {
    return this.algoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.algoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlgoDto: UpdateAlgoDto) {
    return this.algoService.update(+id, updateAlgoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.algoService.remove(+id);
  }
}
