import { IsArray, ArrayNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from 'auth/roles.enum';

export class UpdateUserRoleDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(UserRole, { each: true })
  rol: UserRole[];
}