import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminDto } from './create-admin.dto';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Expose } from 'class-transformer';

export class UpdateUserDto extends PartialType(CreateAdminDto) {
  // Al extender de CreateAdminDto, si este ya tiene password, no necesitas hacer nada.
  // Pero si no la tiene, agrégala aquí:
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(20, { message: 'La contraseña no puede superar los 20 caracteres' })
  // Regex: Al menos una mayúscula, una minúscula y un número
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña es demasiado débil. Debe incluir mayúsculas, minúsculas y números'
  })
  // Saneamiento: IMPORTANTE no usar .trim() en contraseñas, ya que los espacios
  // pueden ser parte de una clave válida y segura.
  @Expose()
  password?: string;
}