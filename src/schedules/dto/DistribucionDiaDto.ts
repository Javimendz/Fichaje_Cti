import { IsNotEmpty, IsString, IsArray, ValidateNested, IsNumber } from 'class-validator'; // 👈 Añade IsNumber
import { Type } from 'class-transformer';
import { CreateFranjaHorariaDto } from 'franja-horaria/dto/create-franja-horaria.dto';

export class DistribucionDiaDto {
  @IsNotEmpty()
  @IsString()
  diaSemana: string;

  @IsNotEmpty()  // 👈 Añade esto
  @IsNumber()    // 👈 Añade esto
  horasDia: number; // 👈 Ahora el DTO ya "conoce" esta propiedad

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFranjaHorariaDto)
  franjas: CreateFranjaHorariaDto[];
}