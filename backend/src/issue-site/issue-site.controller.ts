// src/site/issue-site.controller.ts

import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { IssueSiteService } from './issue-site.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';
import { CreateIssueSiteDto } from './dto/create-issue-site.dto';
import { ResolveIssueDto } from './dto/resolve-issue.dto';
import { AssignIssueDto } from '../issue/dto/asign-issue.dto';

@Controller('site-issues')
@UseGuards(JwtAuthGuard) // 🛡️ Todas las rutas protegidas
export class IssueSiteController {
  constructor(private readonly issueSiteService: IssueSiteService) { }

  // ==========================================
  // 1. CREAR INCIDENCIA (Desde la App o Web)
  // ==========================================
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateIssueSiteDto,
    @GetUser() user: UserPayload,
  ) {
    // El servicio valida que la obra pertenezca a la empresa del usuario
    return await this.issueSiteService.create(createDto, user);
  }

  // ==========================================
  // 2. LISTAR INCIDENCIAS POR OBRA (Panel Admin)
  // ==========================================
  @Get('site/:siteId')
  async findAllBySite(
    @Param('siteId', ParseIntPipe) siteId: number,
    @GetUser() user: UserPayload,
  ) {
    return await this.issueSiteService.findAllBySite(siteId, user);
  }

  // ==========================================
  // 3. RESOLVER INCIDENCIA (Cierre técnico)
  // ==========================================
  @Put('resolve/:id')
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() resolveDto: ResolveIssueDto,
    @GetUser() user: UserPayload,
  ) {
    // Pasamos el ID, el DTO con la nota y el UserPayload (para el resolvedBy)
    return await this.issueSiteService.resolve(id, resolveDto, user);
  }

  @Put('assign/:id')
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignIssueDto,
    @GetUser() admin: UserPayload
  ) {
    return await this.issueSiteService.assign(id, dto, admin);
  }

  @Get('my-tasks')
  async findMyTasks(@GetUser() user: UserPayload) {
    return await this.issueSiteService.findAllAssignedToMe(user.id);
  }
}