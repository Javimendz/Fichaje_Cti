// src/empresas/empresas.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, ParseIntPipe } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
// IMPORTANTE: Asegúrate de importar este DTO

// Auth & Roles
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { GetUser } from 'auth/decorators/get-user.decorator';
import type { UserPayload } from 'auth/interfaces/user-payload.interface';
import { SetupEmpresaDto } from './dto/setup-empresea.dto';

@Controller('empresas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpresaController {
  constructor(private readonly empresasService: EmpresaService) {}

  // --- NUEVO MÉTODO SETUP ---
  @Post('setup')
  @Roles(UserRole.SUPERADMIN) // Solo el SuperAdmin puede crear Empresa + Admin
  async setupEmpresa(@Body() setupEmpresaDto: SetupEmpresaDto) {
    return this.empresasService.createWithAdmin(setupEmpresaDto);
  }

  @Post('crear-empresa')
  @Roles(UserRole.SUPERADMIN)
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresasService.create(createEmpresaDto);
  }

  @Get('get-empresas')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  findAll(@GetUser() user: UserPayload) {
    return this.empresasService.findAll(user);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  findOne(
    @Param('id', ParseIntPipe) id: number, 
    @GetUser() user: UserPayload
  ) {
    return this.empresasService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN)
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateEmpresaDto: UpdateEmpresaDto
  ) {
    return this.empresasService.update(id, updateEmpresaDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.empresasService.remove(id);
  }
}