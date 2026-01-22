import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
/**
 * UpdateUserDto
 *  DTO para la actualización de usuarios.
 * Extiende de CreateUserDto utilizando PartialType para hacer todos los campos opcionales.
 * Esto permite actualizar solo los campos necesarios sin requerir todos los datos del usuario.
 * 
 * @see CreateUserDto para los campos originales.
 * @extends PartialType<CreateUserDto>
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
