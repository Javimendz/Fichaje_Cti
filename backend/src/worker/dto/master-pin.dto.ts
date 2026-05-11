import { IsString, IsNotEmpty } from 'class-validator';


export class MasterPinGenerationDto {

  @IsString()
  @IsNotEmpty()
  dni: string; // El DNI del trabajador
}