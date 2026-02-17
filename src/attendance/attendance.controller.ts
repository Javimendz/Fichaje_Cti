import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; // 👈 Usamos la interfaz ligera

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  async create(
    @GetUser() user: UserPayload, // 👈 Recibimos el Payload del token
    @Body() dto: CreateAttendanceDto
  ) {
    // Pasamos el ID del usuario extraído del token
    return this.attendanceService.create(user.id, dto);
  }

  @Get('my-history')
  async getHistory(@GetUser() user: UserPayload) {
    return this.attendanceService.findAllByUser(user.id);
  }

  @Get('user/:id')
  async getByUserId(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.findAllByUser(id);
  }
}