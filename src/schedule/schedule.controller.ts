import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UnauthorizedException,
  ParseIntPipe,
  Logger,
  UseInterceptors,
  ClassSerializerInterceptor
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import type { UserPayload } from 'auth/interfaces/user-payload.interface'; // 👈 Import type

@Controller('schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
  private readonly logger = new Logger(ScheduleController.name);

  constructor(private readonly schedulesService: ScheduleService) {}

  @Post('crear-schedule')
  @Roles(UserRole.ADMIN)
  create(
    @Body() dto: CreateHorarioDto,
    @GetUser() user: UserPayload,
  ) {
    // Obtenemos el ID validado (será number seguro)
    const empresaId = this.getEmpresaId(user);
    
    this.logger.log(`[Audit] Admin ${user.email} creando horario.`);
    return this.schedulesService.create(dto, user);
  }

  @Get('list-schedules')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  findAll(@GetUser() user: UserPayload) {
    const empresaId = this.getEmpresaId(user); 
    return this.schedulesService.findAllByEmpresa(empresaId); 
  }

  /**
   * 
   * @param id  
   * @param user 
   * @returns 
   */
  @Get('find/:id')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload,
  ) {
    const empresaId = this.getEmpresaId(user);
    return this.schedulesService.findOne(id, empresaId);
  }

  /**
   *  
   * @param id      
   * @param user    
   * @returns 
   */
  @Delete('delete/:id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload,
  ) {
    const empresaId = this.getEmpresaId(user);
    this.logger.warn(`[Audit] Admin ${user.email} eliminando horario ${id}`);
    return this.schedulesService.remove(id, empresaId);
  }

  

  
  /**
   *     
   * @param user  
   * @returns 
   */

  private getEmpresaId(user: UserPayload): number {
    if (!user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa asignada para realizar esta acción');
    }
    return user.empresaId;
  }
}