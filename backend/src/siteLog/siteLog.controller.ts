import { Controller, Post, Body, Patch, Param, UseGuards, ParseIntPipe, Get, Query, BadRequestException, Delete } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';
import { CheckInSiteDto } from '../site/dto/checkInSite.dto';
import { CheckOutSiteDto } from '../site/dto/checkOutSite.dto';
import { SiteLogService } from './siteLog.service';
import { UpdateSiteLogDto } from './dto/update-siteLog.dto';

@Controller('site-logs')
@UseGuards(JwtAuthGuard)
export class SiteLogController {
  constructor(private readonly siteLogService: SiteLogService) { }

  @Post('check-in')
  async checkIn(
    @Body() dto: CheckInSiteDto,
    @GetUser() user: UserPayload
  ) {
    return await this.siteLogService.checkIn(dto, user);
  }

  @Patch('check-out/:id')
  async checkOut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CheckOutSiteDto,
    @GetUser() user: UserPayload
  ) {
    return await this.siteLogService.checkOut(id, dto, user);
  }

  @Get('report/:userId')
  @UseGuards(JwtAuthGuard)
  async getReport(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('start') start: string, // Ejemplo: ?start=2026-04-01
    @Query('end') end: string,     // Ejemplo: ?end=2026-04-30
    @GetUser() admin: UserPayload
  ) {
    if (!start || !end) {
      throw new BadRequestException('Debe proporcionar una fecha de inicio y fin (YYYY-MM-DD)');
    }

    return await this.siteLogService.getWorkerReport(userId, start, end, admin.empresaId);
  }


  // Admin busca fichajes de la empresa
  @Get('admin/search')
  async adminSearch(
    @GetUser() user: UserPayload,
    @Query('siteId') siteId?: number,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return await this.siteLogService.findAllAdmin(user.empresaId, { siteId, start, end });
  }

  // Admin corrige un fichaje
  @Patch('admin/correct/:id')
  async correctLog(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSiteLogDto,
    @GetUser() admin: UserPayload
  ) {
    return await this.siteLogService.updateManual(id, dto, admin);
  }

  @Delete('admin/:id')
  async deleteLog(@Param('id', ParseIntPipe) id: number, @GetUser() admin: UserPayload) {
    return await this.siteLogService.remove(id, admin);
  }

  @Get('my-history')
  async getMyLogs(@GetUser() user: UserPayload, @Query('page') page: number) {
    return await this.siteLogService.findMyLogs(user.id, page);
  }

  @Post('start-break/:logId')
@UseGuards(JwtAuthGuard)
async startBreak(
  @Param('logId', ParseIntPipe) logId: number,
  @GetUser() user: UserPayload
) {
  return await this.siteLogService.startBreak(logId, user);
}

@Post('end-break/:logId')
@UseGuards(JwtAuthGuard)
async endBreak(
  @Param('logId', ParseIntPipe) logId: number,
  @GetUser() user: UserPayload
) {
  return await this.siteLogService.endBreak(logId, user);
}
}