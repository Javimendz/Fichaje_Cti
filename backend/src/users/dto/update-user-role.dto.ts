import { IsArray, ArrayNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from 'auth/roles.enum';
/**
 * UpdateUserRoleDto
 * 
 * DTO para actualizar el rol de un usuario.  
 * Contiene una propiedad 'rol' que es un arreglo de roles permitidos.
 *  Valida que el arreglo no esté vacío y que cada elemento sea un valor válido del enum UserRole.
 * @property {UserRole[]} rol - Arreglo de roles a asignar al usuario.
 * @uses class-validator para validación de datos.
 * @see UserRole para los posibles roles que se pueden asignar.
 * 
 */
export class UpdateUserRoleDto {
  @IsArray() // Valida que sea un arreglo
  @ArrayNotEmpty() // El arreglo no debe estar vacío
  @IsEnum(UserRole, { each: true }) // Cada elemento debe ser un valor válido del enum UserRole
  rol: UserRole[]; // Arreglo de roles a asignar al usuario
}