import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminDto } from './create-admin.dto';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Expose } from 'class-transformer';

export class UpdateUserDto extends PartialType(CreateAdminDto) {
  
  // Solo validamos la contraseña en el DTO de actualización, ya que el resto de campos se heredan de CreateAdminDto y ya tienen sus validaciones.
  // Validación de la contraseña: opcional, pero si se proporciona, debe cumplir con los requisitos de seguridad.
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(20, { message: 'La contraseña no puede superar los 20 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña es demasiado débil. Debe incluir al menos una mayúscula, una minúscula y un número o símbolo'
  })
  password?: string;
}