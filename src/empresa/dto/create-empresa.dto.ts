import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Matches, MaxLength, MinLength } from 'class-validator';


export class CreateEmpresaDto {
 
  @IsString({ message: 'El nombre de la empresa debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de la empresa es obligatorio' })
  @MaxLength(100, { message: 'El nombre de la empresa es demasiado largo' })
  // Regex: Letras, números, espacios y símbolos comunes de empresas (&, ., -, /)
  @Matches(/^[a-zA-Z0-9à-ÿÀ-ßñÑ\s\.\&\-\/]+$/, {
    message: 'El nombre de la empresa contiene caracteres no permitidos',
  })
  // Estandarización: Quita espacios y pasa a MAYÚSCULAS para consistencia en BD
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @Expose()
  nombre: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()) // "B-123.456" -> "B123456"
  // Validación básica de formato CIF/NIF español (Letra + 8 dígitos o 7+letra)
  @Matches(/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-Z]$/i, { 
    message: 'El formato del CIF no es válido' 
  })
  cif?: string;

  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsOptional()
  // Regex: Permite letras, números, tildes, ñ, y símbolos comunes de dirección (º, ª, /, -, ., ,)
  @Matches(/^[a-zA-Z0-9à-ÿÀ-ßñÑ\s\.,\-\/ºª]+$/, {
    message: 'La dirección contiene caracteres no permitidos',
  })
  @MaxLength(150, { message: 'La dirección es demasiado larga (máximo 150 caracteres)' })
  // Saneamiento: Elimina espacios accidentales al inicio y final
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Expose()
  direccion?: string;

  @IsString({ message: 'La provincia debe ser una cadena de texto' })
  @IsOptional()
  // Regex: Solo letras, espacios y guiones (ej: Santa Cruz de Tenerife, Castellón)
  @Matches(/^[a-zA-Zà-ÿÀ-ßñÑ\s\-]+$/, {
    message: 'La provincia contiene caracteres no permitidos',
  })
  @MaxLength(50, { message: 'El nombre de la provincia es demasiado largo' })
  // Saneamiento: Elimina espacios y asegura que la primera letra sea mayúscula
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  })
  @Expose()
  provincia?: string;

  @IsString({ message: 'La población debe ser una cadena de texto' })
  @IsOptional()
  // Regex: Letras, tildes, ñ, espacios y guiones para nombres compuestos
  @Matches(/^[a-zA-Zà-ÿÀ-ßñÑ\s\-]+$/, {
    message: 'La población contiene caracteres no permitidos (solo letras, espacios y guiones)',
  })
  @MaxLength(100, { message: 'El nombre de la población es demasiado largo' })
  // Saneamiento: Elimina espacios innecesarios
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Expose()
  poblacion?: string;

  @IsString({ message: 'El país debe ser una cadena de texto' })
  @IsOptional()
  // Regex: Solo letras, tildes y espacios (útil para "Reino Unido", "España", "EE. UU.")
  @Matches(/^[a-zA-Zà-ÿÀ-ßñÑ\s\.]+$/, {
    message: 'El nombre del país solo puede contener letras y puntos',
  })
  @MinLength(3, { message: 'El nombre del país es demasiado corto' })
  @MaxLength(50, { message: 'El nombre del país es demasiado largo' })
  // Saneamiento: Limpia espacios accidentales
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Expose()
  pais?: string;

  @IsOptional()
  @IsString() // Buena práctica asegurar que sea string antes de validar formato
  @IsEmail({}, { message: 'El email de contacto no tiene un formato válido' })
  // Normalización: minúsculas y quitar espacios en blanco
  @Transform(({ value }) => value?.toLowerCase().trim())
  @Expose()
  email?: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El teléfono de la empresa es obligatorio' })
  @IsPhoneNumber('ES', { 
    message: 'El teléfono debe ser un número válido de España (ej: 912345678 o +34 600000000)' 
  })
  // Eliminamos espacios, guiones o paréntesis para estandarizar el guardado
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/[\s\(\)\-]/g, '') : value)
  @Expose()
  telefono: string;

  @IsString()
  @IsNotEmpty({ message: 'El código postal es obligatorio' })
  // Valida que sean exactamente 5 números (Formato España)
  @Matches(/^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/, { 
    message: 'El código postal debe ser un formato válido de España (5 dígitos)' 
  })
  codigoPostal: string;

}