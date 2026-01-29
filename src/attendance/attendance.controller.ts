import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, ClassSerializerInterceptor, ParseUUIDPipe } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

 
  @Post()
  async create(
    @GetUser() user: User, 
    @Body() dto: CreateAttendanceDto
  ) {
    return this.attendanceService.create(user.id, dto.presente, dto.motivo);
  }

 
  @Get('my-history')
  async getHistory(@GetUser() user: User) {
    return this.attendanceService.findAllByUser(user.id);
  }

  
  @Get('user/:id')
  async getByUserId(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.findAllByUser(id);
  }
}