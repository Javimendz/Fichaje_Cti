import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AllowedUserService } from './allowed-user.service';
import { CreateAllowedUserDto } from './dto/create-allowed-user.dto';
import { UpdateAllowedUserDto } from './dto/update-allowed-user.dto';

@Controller('allowed-user')
export class AllowedUserController {
  constructor(private readonly allowedUserService: AllowedUserService) {}

  @Post()
  create(@Body() createAllowedUserDto: CreateAllowedUserDto) {
    return this.allowedUserService.create(createAllowedUserDto);
  }

  @Get()
  findAll() {
    return this.allowedUserService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.allowedUserService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAllowedUserDto: UpdateAllowedUserDto) {
    return this.allowedUserService.update(+id, updateAllowedUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.allowedUserService.remove(+id);
  }
}
