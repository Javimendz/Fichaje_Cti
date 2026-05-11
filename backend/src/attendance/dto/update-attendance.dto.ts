import { PartialType } from '@nestjs/mapped-types';
import { CreateAttendanceDto } from './create-attendance.dto';


// 🟢 UpdateAttendanceDto
// DTO para actualizar un registro de asistencia, basado en CreateAttendanceDto pero con todos los campos opcionales.
/**
 * UpdateAttendanceDto
 * DTO para actualizar un registro de asistencia, basado en CreateAttendanceDto pero con todos los campos opcionales.
 * Utiliza PartialType de @nestjs/mapped-types para heredar las propiedades de CreateAttendanceDto y hacerlas opcionales, lo que permite actualizar solo los campos necesarios sin requerir toda la información.
 * Este DTO es útil para los endpoints de actualización de asistencia, donde un trabajador o administrador puede modificar el estado de presencia o el motivo de ausencia sin necesidad de proporcionar todos los datos del registro.
 * */
export class UpdateAttendanceDto extends PartialType(CreateAttendanceDto) {}
