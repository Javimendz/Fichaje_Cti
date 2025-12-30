import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AllowedPhonesService } from './allowed-phones.service';
import { CreateAllowedPhoneDto } from './dto/create-allowed-phone.dto';
import { UserRole } from 'auth/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'auth/decorators/roles.decorator';
import { RolesGuard } from 'auth/guards/roles.guard';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('allowed-phones')
export class AllowedPhonesController {
  constructor(private readonly allowedPhonesService: AllowedPhonesService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.allowedPhonesService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateAllowedPhoneDto) {
    return this.allowedPhonesService.create(dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.allowedPhonesService.remove(id);
  }
}
