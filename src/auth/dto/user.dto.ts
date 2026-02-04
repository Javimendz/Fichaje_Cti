import { UserRole } from 'auth/roles.enum';
import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UserDto {
  @Expose()
  id: number;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre es demasiado largo' })
  // Regex: Permite letras (incluyendo tildes y ñ) y espacios. Evita números y símbolos.
  @Matches(/^[a-zA-Zà-ÿÀ-ßñÑ\s]+$/, {
    message: 'El nombre solo puede contener letras',
  })
  // Limpieza: Elimina espacios extra al inicio y al final
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Expose()
  nombre: string;

  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  // Convierte a minúsculas y elimina espacios para evitar duplicados (ej: " User@Email.com")
  @Transform(({ value }) => value?.toLowerCase().trim())
  @Expose()
  email: string;

  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @IsEnum(UserRole, { 
    message: 'El rol debe ser uno de los siguientes valores: ' + Object.values(UserRole).join(', ') 
  })
  @Expose()
  rol: string;
}