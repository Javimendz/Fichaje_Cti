import { IsNotEmpty, IsString, MaxLength, IsOptional, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { TipoPuesto } from './tipo-puesto.enum';

/**
 *  DTO para la creación de una actividad (puesto de trabajo)
 * 
 * Este DTO define los campos necesarios para la creación de un nuevo puesto de trabajo,
 * incluyendo su tipo, nombre, descripción, fecha y estado activo.
 * 
 * @param tipo Tipo de puesto (Ej: Operario, Supervisor, etc.)
 * @param nombre Nombre específico del puesto (Ej: Operario 1, Supervisor de Producción)
 * @param descripcion Descripción opcional del puesto
 * @param fecha Fecha en la que se creará el puesto (formato YYYY-MM-DD)
 * @param activa Estado opcional del puesto (activo/inactivo)
 */
export class CreateActividadDto {
  // Validamos que sea uno de los puestos de la fábrica
  @IsNotEmpty({ message: 'El tipo de puesto es obligatorio' })
  @IsEnum(TipoPuesto, { 
    message: `El tipo debe ser uno de: ${Object.values(TipoPuesto).join(', ')}` 
  })
  tipo: TipoPuesto;

  @IsNotEmpty({ message: 'El nombre específico es obligatorio' })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  // Validamos la fecha (formato YYYY-MM-DD)
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  @IsDateString({}, { message: 'La fecha debe tener un formato válido (Ej: 2026-02-26)' })
  fecha: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}