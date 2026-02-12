// src/empresas/empresas.controller.ts

import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  UseGuards, ParseIntPipe, Put, Req // 👈 Asegúrate de importar Req
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
// IMPORTANTE: Asegúrate de importar este DTO
import { Request } from 'express';  
// Auth & Roles
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { GetUser } from 'auth/decorators/get-user.decorator';
import type { UserPayload } from 'auth/interfaces/user-payload.interface';
import { SetupCompanyDto } from './dto/setup-company.dto';

@Controller('empresa')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly empresasService: CompanyService) {}

  // --- NUEVO MÉTODO CREAR EMPRESA ---
  @Post('crear-empresa')
  @Roles(UserRole.SUPERADMIN) // Solo el SuperAdmin puede crear Empresa + Admin
  async setupEmpresa(@Body() setupEmpresaDto: SetupCompanyDto) {
    return this.empresasService.createWithAdmin(setupEmpresaDto);
  }

  /*@Post('crear-empresa')
  @Roles(UserRole.SUPERADMIN)
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresasService.create(createEmpresaDto);
  }
*/


@Get('list-empresas')
@Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
findAll(@GetUser() user: UserPayload) { 
  // 1. Cambiamos userId por id
  // 2. Usamos el email que ahora sí tenemos disponible
  console.log(`[Audit] Listado de empresas solicitado por: ${user.email} (ID: ${user.id}) (Rol: ${user.rol})`);
  
  return this.empresasService.findAll(user);
}

  @Get('find/:id')
  @Roles(UserRole.SUPERADMIN)
  findOne(
    @Param('id', ParseIntPipe) id: number, 
    @GetUser() user: UserPayload
  ) {
    return this.empresasService.findOne(id, user);
  }

  @Put('update/:id')
  @Roles(UserRole.SUPERADMIN)
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateEmpresaDto: UpdateCompanyDto
  ) {
    return this.empresasService.update(id, updateEmpresaDto);
  }

  @Delete('delete/:id')
  @Roles(UserRole.SUPERADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.empresasService.remove(id);
  }
}