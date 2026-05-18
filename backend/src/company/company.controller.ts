// src/empresas/empresas.controller.ts
import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  UseGuards, ParseIntPipe, Put, Req, 
  DefaultValuePipe,
  Query,
  BadRequestException
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
// Auth & Roles
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';  
import { SetupCompanyDto } from './dto/setup-company.dto';

@Controller('empresa')
// 🚩 QUITAMOS EL UseGuards DE AQUÍ PARA PODER TENER RUTAS PÚBLICAS
export class CompanyController {
  constructor(private readonly empresasService: CompanyService) {}

  // ====================================================================
  // 🔓 RUTA PÚBLICA: AUTO-REGISTRO DE EMPRESAS (Cualquiera puede entrar)
  // ====================================================================
  @Post('crear-empresa')
  // 🚩 Quitamos el @Roles(SUPERADMIN) para que la gente normal pueda registrarse
  async setupEmpresa(@Body() setupEmpresaDto: SetupCompanyDto) {
    return this.empresasService.createWithAdmin(setupEmpresaDto);
  }

  // ====================================================================
  // 🔒 RUTAS PRIVADAS: REQUIEREN TOKEN Y ROL
  // ====================================================================

  @UseGuards(JwtAuthGuard, RolesGuard) // 🚩 Protegemos esta ruta
  @Get('list-empresas')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @GetUser() user: UserPayload
  ) { 
    console.log(`[Audit] Listado paginado solicitado por: ${user.email} (Pág: ${page}, Lím: ${limit})`);
    return this.empresasService.findAll(user, page, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard) // 🚩 Protegemos esta ruta
  @Get('find/:id')
  @Roles(UserRole.SUPERADMIN)
  findOne(
    @Param('id', ParseIntPipe) id: number, 
    @GetUser() user: UserPayload
  ) {
    return this.empresasService.findOne(id, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard) // 🚩 Protegemos esta ruta
  @Put('update/:id')
  @Roles(UserRole.SUPERADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @GetUser() user: UserPayload
  ) {
    return this.empresasService.update(id, updateCompanyDto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard) // 🚩 Protegemos esta ruta
  @Delete('delete/:id')
  @Roles(UserRole.SUPERADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.empresasService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard) // 🚩 Protegemos esta ruta (¡No debe ser pública!)
  @Patch(':id/subscription')
  @Roles(UserRole.SUPERADMIN) // 🚩 Solo TÚ (SuperAdmin) puedes regalar cuentas Premium
  async updatePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body('plan') plan: 'trial' | 'premium' | 'expired',
    @GetUser() user: UserPayload,
  ) {
    if (!['trial', 'premium', 'expired'].includes(plan)) {
      throw new BadRequestException('El plan debe ser trial, premium o expired');
    }
    return this.empresasService.updateSubscriptionPlan(id, plan, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard) // 🚩 Protegemos esta ruta
  @Put('settings/archive')
  @Roles(UserRole.ADMIN)
  async updateArchiveSettings(
    @GetUser() user: UserPayload,
    @Body() dto: UpdateCompanyDto
  ) {
    return await this.empresasService.update(user.empresaId, dto, user);
  }
}