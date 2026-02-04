import { IsEmail, IsOptional, IsString, IsNotEmpty, Matches, IsDateString, IsNumber, IsArray, MaxLength, MinLength, Max, Min, IsInt, ArrayUnique } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';

export class UserBaseDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre es demasiado corto' })
  @MaxLength(50, { message: 'El nombre es demasiado largo' })
  // Saneamiento: Elimina espacios accidentales y normaliza el texto
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, ' '); // " Juan  Pablo " -> "Juan Pablo"
  })
  @Expose()
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  @MinLength(2, { message: 'Los apellidos son demasiado cortos' })
  @MaxLength(100, { message: 'Los apellidos no pueden superar los 100 caracteres' })
  // Saneamiento: Elimina espacios al inicio/final y reduce espacios múltiples internos
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, ' '); 
  })
  @Expose()
  apellidos?: string;

  // CAMBIO: Ahora es opcional para que el hijo decida si lo pide o no
 @IsOptional()
  @IsString({ message: 'el DNI debe ser una cadena de texto' })
  // Regex: 8 números seguidos de una letra (ignora mayúsculas/minúsculas con el flag /i)
  @Matches(/^[0-9]{8}[A-Z]$/i, { 
    message: 'El DNI debe tener 8 números y una letra (ej: 12345678Z)' 
  })
  // Saneamiento: Elimina espacios y convierte la letra a MAYÚSCULA siempre
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @Expose()
  dni?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  // Regex: Permite un '+' opcional seguido de 9 a 15 dígitos
  @Matches(/^\+?[0-9]{9,15}$/, { 
    message: 'El teléfono debe tener entre 9 y 15 dígitos y puede incluir el prefijo + (Ej: +34600000000)' 
  })
  @MaxLength(20)
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.replace(/[\s\-\.]/g, ''); // "+34 600-00.00" -> "+3460000000"
  })
  @Expose()
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El formato del email no es válido (ejemplo@dominio.com)' })
  @IsString()
  @MaxLength(150, { message: 'El email es demasiado largo' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @Expose()
  email?: string;

 @IsOptional()
  @IsDateString({}, { 
    message: 'La fecha de nacimiento debe ser una fecha válida en formato AAAA-MM-DD' 
  })
  // Saneamiento: Asegura que no haya espacios laterales
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Expose()
  fechaNacimiento?: string;

  @IsOptional()
  @IsString({ message: 'El país debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre del país es demasiado corto' })
  @MaxLength(60, { message: 'El nombre del país es demasiado largo' })
  // Saneamiento: Limpieza y capitalización inteligente
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    // Convierte "españa" o "ESPAÑA" en "España"
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  })
  @Expose()
  pais?: string;

  @IsOptional()
  @IsString({ message: 'La calle debe ser una cadena de texto' })
  @MinLength(3, { message: 'La dirección es demasiado corta' })
  @MaxLength(150, { message: 'La dirección es demasiado larga' })
  // Saneamiento: Elimina espacios accidentales y normaliza el texto
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, ' '); // Limpia espacios dobles internos
  })
  @Expose()
  calle?: string;

  @IsOptional()
  @IsString({ message: 'La población debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre de la población es demasiado corto' })
  @MaxLength(100, { message: 'El nombre de la población es demasiado largo' })
  // Saneamiento: Elimina espacios y aplica capitalización correcta
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    // Convierte "BARCELONA" o "madrid" en "Barcelona" o "Madrid"
    return cleaned.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  })
  @Expose()
  poblacion?: string;

  @IsOptional()
  @IsString({ message: 'La provincia debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre de la provincia es demasiado corto' })
  @MaxLength(50, { message: 'El nombre de la provincia es demasiado largo' })
  // Saneamiento: Limpia espacios y estandariza el formato
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    // Capitaliza cada palabra (ej: "las palmas" -> "Las Palmas")
    return cleaned.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  })
  @Expose()
  provincia?: string;

  @IsOptional()
  @IsString({ message: 'La categoría debe ser una cadena de texto' })
  @MinLength(2, { message: 'La categoría es demasiado corta' })
  @MaxLength(100, { message: 'La categoría es demasiado larga' })
  // Saneamiento: Normaliza a MAYÚSCULAS para consistencia en filtros y DB
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.trim().toUpperCase().replace(/\s+/g, ' ');
  })
  @Expose()
  categoria?: string;

  @IsOptional()
  @IsString({ message: 'La actividad debe ser una cadena de texto' })
  @MinLength(3, { message: 'La descripción de la actividad es muy breve' })
  @MaxLength(255, { message: 'La actividad no puede superar los 255 caracteres' })
  // Saneamiento: Limpia espacios y normaliza el formato de frase
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/\s+/g, ' ');
    // Opcional: Asegura que empiece con mayúscula para reportes visuales
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  })
  @Expose()
  actividad?: string;

  @IsOptional()
  @IsInt({ message: 'El día debe ser un número entero' })
  @IsNumber({}, { message: 'El valor de diaPertenece debe ser numérico' })
  @Min(1, { message: 'El día no puede ser menor a 1' })
  @Max(31, { message: 'El día no puede ser mayor a 31' })
  @Expose()
  diaPertenece?: number;

  @IsOptional()
  @IsArray({ message: 'El campo rol debe ser una lista (array)' })
  @IsString({ 
    each: true, 
    message: 'Cada rol debe ser una cadena de texto' 
  })
  @ArrayUnique({ message: 'No se permiten roles duplicados en la lista' })
  // Saneamiento: Limpia espacios y asegura mayúsculas en cada elemento
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return value;
    return value.map(v => typeof v === 'string' ? v.trim().toUpperCase() : v);
  })
  @Expose()
  rol?: string[];
}