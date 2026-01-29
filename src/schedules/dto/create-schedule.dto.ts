import { Type } from "class-transformer";
import { IsArray, IsDateString, IsString, ValidateNested } from "class-validator";
import { DistribucionDiaDto } from "./DistribucionDiaDto";

export class CreateHorarioDto {
  @IsString()
  nombre: string;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsString()
  tipo: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DistribucionDiaDto) 
  distribuciones: DistribucionDiaDto[];
}