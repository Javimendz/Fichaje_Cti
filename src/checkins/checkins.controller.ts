import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';

@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Post()
  create(@Body() createCheckinDto: CreateCheckinDto) {
    return this.checkinsService.create(createCheckinDto);
  }

  @Get()
  findAll() {
    return this.checkinsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkinsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCheckinDto: UpdateCheckinDto) {
    return this.checkinsService.update(+id, updateCheckinDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checkinsService.remove(+id);
  }
}
