import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
  ParseIntPipe,
} from '@nestjs/common';

import { IssueService } from './issue.service';
import { CreateIncidenciaDto } from './dto/create-issue.dto';
import { UpdateIncidenciaDto } from './dto/update-issue.dto';

import { RolesGuard } from 'auth/guards/roles.guard';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { GetUser } from 'auth/decorators/get-user.decorator';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import type { UserPayload } from 'auth/interfaces/user-payload.interface';

@Controller('incidencias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidenciaController {
  constructor(private readonly issueService: IssueService) {}

  // ===============================
  // TRABAJADOR
  // ===============================

  @Post('crear')
  @Roles(UserRole.WORKER, UserRole.ADMIN)
  create(
    @Body() dto: CreateIncidenciaDto,
    @GetUser() user: UserPayload,
  ) {
    return this.issueService.create(
      user.id,
      user.empresaId,
      dto,
    );
  }

  @Get('mis-incidencias')
  @Roles(UserRole.WORKER, UserRole.ADMIN)
  findMine(@GetUser() user: UserPayload) {
    return this.issueService.findAllByUsuario(user.id);
  }

  // ===============================
  // ADMIN
  // ===============================

  @Get('empresa')
  @Roles(UserRole.ADMIN)
  findAllForAdmin(
    @GetUser() user: UserPayload,
    @Query('pendientes') pendientes?: string,
  ) {
    const soloPendientes = pendientes === 'true';

    return this.issueService.findAllByEmpresa(
      user.empresaId,
      soloPendientes,
    );
  }

  @Put('resolver/:id')
  @Roles(UserRole.ADMIN)
  resolver(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload,
  ) {
    return this.issueService.resolver(id, user.empresaId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncidenciaDto,
    @GetUser() user: UserPayload,
  ) {
    return this.issueService.update(id, user.empresaId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload,
  ) {
    return this.issueService.remove(id, user.empresaId);
  }
}
