import { IsDateString, IsEnum, IsNumber } from 'class-validator';
import { LeaveType } from 'leaves/entities/leaf.entity';

export class CreateLeaveRangeDto {
  @IsNumber()
  usuarioId: number;

  @IsDateString()
  fechaInicio: string; // Formato YYYY-MM-DD

  @IsDateString()
  fechaFin: string;    // Formato YYYY-MM-DD

  @IsEnum(LeaveType)
  tipo: LeaveType;
}