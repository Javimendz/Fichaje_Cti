import { Expose, Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength, ValidateIf } from "class-validator";


// LoginDto
/**
 * * * * LoginDto
 * * * DTO para el proceso de inicio de sesión. Permite a los usuarios autenticarse utilizando su correo electrónico o DNI junto con su contraseña. El LoginDto utiliza class-validator para validar los datos de entrada, asegurando que el correo electrónico tenga un formato válido y que la contraseña cumpla con ciertos requisitos de seguridad, como una longitud mínima y la inclusión de mayúsculas, números o símbolos. Este DTO es esencial para garantizar que solo se acepten credenciales válidas durante el proceso de autenticación, mejorando así la seguridad del sistema.
 * */
export class LoginDto {
  @IsOptional()
  @Expose()
  // Normalizamos el email a minúsculas antes de validar para evitar duplicados
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail({}, { message: 'El formato del email no es válido' })
  // Validamos el email solo si el DNI NO está presente
  @ValidateIf(o => !o.dni)
  @IsNotEmpty({ message: 'Debes proporcionar al menos el email o el DNI' })
  readonly email?: string;

  @IsOptional()
  @IsString({ message: 'El DNI debe ser una cadena de texto' })
  @Expose()
  // Validamos el DNI solo si el email NO está presente
  @ValidateIf(o => !o.email)
  @IsNotEmpty({ message: 'Debes proporcionar al menos el email o el DNI' })
  // Añadimos la Regex de formato oficial para asegurar la calidad
  @Matches(/^[0-9]{8}[TRWAGMYFPDXBNJZSTQVHLCKE]$/i, {
    message: 'El formato del DNI no es válido (ej: 12345678Z)',
  })
  readonly dni?: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  // Regex para: Al menos una mayúscula, una minúscula, un número y un carácter especial
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña es demasiado débil (debe incluir mayúsculas, números o símbolos)',
  })
  readonly password: string;
}