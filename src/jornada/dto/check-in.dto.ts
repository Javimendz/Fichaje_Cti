import { IsNumber, IsOptional } from 'class-validator';

export class CheckInDto {
  @IsNumber()
  @IsOptional()
  latitud?: number;

  @IsNumber()
  @IsOptional()
  longitud?: number;
}