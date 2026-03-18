import { PartialType } from '@nestjs/swagger';
import { CreateAbsenceDto } from './create-absence.dto';


// El DTO UpdateAbsenceDto se utiliza para validar los datos de entrada al actualizar una ausencia existente. Extiende el CreateAbsenceDto utilizando PartialType, lo que significa que todas las propiedades del CreateAbsenceDto son opcionales en el UpdateAbsenceDto. Esto permite que el usuario solo envíe los campos que desea actualizar, sin necesidad de proporcionar todos los datos de la ausencia.
/****
 * * * UpdateAbsenceDto     
 *  * * DTO para actualizar una ausencia existente. Extiende el CreateAbsenceDto utilizando PartialType, lo que significa que todas las propiedades del CreateAbsenceDto son opcionales en el UpdateAbsenceDto. Esto permite que el usuario solo envíe los campos que desea actualizar, sin necesidad de proporcionar todos los datos de la ausencia.
 * */
export class UpdateAbsenceDto extends PartialType(CreateAbsenceDto) {}
