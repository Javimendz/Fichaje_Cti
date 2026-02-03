import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from "class-validator";

export class LoginDto {
  @IsOptional()
  @IsEmail({}, { message: 'El formato del email no es válido' })
  readonly email?: string;

  @IsOptional()
  @IsString()
  // Validamos el DNI solo si el email no está presente
  @ValidateIf(o => !o.email)
  @IsNotEmpty({ message: 'Debes proporcionar el email o el DNI' })
  readonly dni?: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 6 caracteres' })
  readonly password: string;
}