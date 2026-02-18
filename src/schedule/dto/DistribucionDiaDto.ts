  import { IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional, ArrayMinSize, Min, Max, IsEnum } from 'class-validator'; // 👈 Añade IsNumber
  import { Expose, Transform, Type } from 'class-transformer';
  import { CreateTimeSlotDto } from 'timeSlot/dto/create-timeSlot.dto';
import { DiaSemana } from 'schedule/entities/distribucion-dia.entity';

   
  /**
   * DistribucionDiaDto
   * DTO para representar la distribución de un día en el horario. Contiene el día de la semana, el total de horas asignadas a ese día y una lista de franjas horarias específicas. Utiliza class-validator para validar los datos de entrada y class-transformer para transformar y exponer las propiedades correctamente.
   * @property {DiaSemana} diaSemana - El día de la semana para esta distribución (LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO). Es obligatorio y se valida contra un enum.
   * @property {number} horasDia - El total de horas asignadas a este día. Es obligatorio, debe ser un número entre 0 y 24, y se transforma a número real si llega como string.
   * @property {CreateTimeSlotDto[]} [franjas] - Una lista opcional de franjas horarias específicas para este día. Si se proporcionan, deben ser objetos válidos de CreateTimeSlotDto y se valida que haya al menos una franja si el array no está vacío.
   * @uses class-validator para validación de datos y class-transformer para transformación y exposición de propiedades.
   * @example
   * ```typescript
   * const distribucionDia: DistribucionDiaDto = {
   * diaSemana: DiaSemana.LUNES,
   * horasDia: 8,
   * franjas: [
   *  { inicio: '08:00', fin: '12:00', distribucionDiaId: 1 },
   * { inicio: '13:00', fin: '17:00', distribucionDiaId: 1 }
   * ]
   * };
   * ```
   */
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