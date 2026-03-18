import { Controller, Get, Post, Request, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AllowedPhonesService } from './allowed-phones.service';
import { CreateAllowedPhoneDto } from './dto/create-allowed-phone.dto';
import { UserRole } from 'auth/roles.enum';
import { Roles } from 'auth/decorators/roles.decorator';
import { RolesGuard } from 'auth/guards/roles.guard';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
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
create(@Body() dto: CreateAllowedPhoneDto, @Request() req: any) {
  // Prueba con req.user.id si req.user.sub te da undefined
  const adminId = req.user.id || req.user.sub; 
  const empresaId = req.user.empresaId;

  console.log('Datos del Token:', req.user); // Esto te dirá qué campos tiene tu token realmente

  return this.allowedPhonesService.create(dto, adminId, empresaId);
}

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.allowedPhonesService.remove(id);
  }
}
