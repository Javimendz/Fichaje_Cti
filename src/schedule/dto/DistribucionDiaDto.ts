  import { IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional, ArrayMinSize, Min, Max, IsEnum } from 'class-validator'; // 👈 Añade IsNumber
  import { Expose, Transform, Type } from 'class-transformer';
  import { CreateTimeSlotDto } from 'timeSlot/dto/create-timeSlot.dto';
import { DiaSemana } from 'schedule/entities/distribucion-dia.entity';

   

  export class DistribucionDiaDto {
   @IsNotEmpty({ message: 'El día de la semana es obligatorio' })
  @IsEnum(DiaSemana, { 
    message: 'El día debe ser un día válido (LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO)' 
  })
  // Saneamiento: Lo pasamos a mayúsculas y quitamos espacios para que coincida con el Enum
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @Expose()
  diaSemana: DiaSemana;

   @IsNotEmpty({ message: 'El total de horas del día es obligatorio' })
  @IsNumber({}, { message: 'Las horas del día deben ser un valor numérico' })
  // El límite lógico es 24 horas, pero podrías ajustarlo según convenio (ej: 12h)
  @Min(0, { message: 'Las horas no pueden ser negativas' })
  @Max(24, { message: 'Las horas no pueden superar las 24h por día' })
  // Saneamiento: Asegura que si llega como string ("8.5"), se convierta a número real
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @Expose()
  horasDia: number;

   @IsOptional() // Opcional si el día puede no tener franjas (ej: festivos)
  @IsArray({ message: 'Las franjas deben enviarse como una lista' })
  @ArrayMinSize(1, { message: 'Si defines franjas, debes incluir al menos una' })
  @ValidateNested({ each: true })
  // Fundamental para que class-transformer instancie cada objeto del array
  @Type(() => CreateTimeSlotDto)
  @Expose()
  franjas: CreateTimeSlotDto[];
  }