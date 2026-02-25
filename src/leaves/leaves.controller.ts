import { Controller, Post, Body, Get, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveRangeDto } from './dto/create-leaf.dto';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { GetUser } from 'auth/decorators/get-user.decorator';
import type { UserPayload } from 'auth/interfaces/user-payload.interface';

@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard) // Protegemos todo el controlador
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  // --- 1. CREAR RANGO (SOLO ADMIN) ---
  // Este es el método que usaremos para asignar vacaciones masivas
  @Post('range')
  @Roles(UserRole.ADMIN)
  async createRange(@Body() dto: CreateLeaveRangeDto) {
    return this.leavesService.createRange(dto);
  }

  // --- 2. VER MIS PERMISOS (WORKER Y ADMIN) ---
  // Permite que el trabajador vea qué días tiene aprobados
  @Get('my-leaves')
  @Roles(UserRole.WORKER, UserRole.ADMIN)
  async getMyLeaves(@GetUser() user: UserPayload) {
    return this.leavesService.findAllByUser(user.id);
  }

  // --- 3. VER PERMISOS DE UN USUARIO (SOLO ADMIN) ---
  @Get('user/:id')
  @Roles(UserRole.ADMIN)
  async getUserLeaves(@Param('id', ParseIntPipe) id: number) {
    return this.leavesService.findAllByUser(id);
  }
}