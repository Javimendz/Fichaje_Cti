import { 
  IsNotEmpty, 
  IsString, 
  IsOptional, 
  IsEmail, 
  ValidateNested, 
  IsPhoneNumber, 
  Matches,
  IsObject,
  MinLength,
  MaxLength
} from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { CreateAdminDto } from 'users/dto/create-admin.dto';

export class SetupEmpresaDto {
  
  // ============================================
  // IDENTIFICACIÓN DE LA EMPRESA
  // ============================================
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la empresa es obligatorio' })
  nombreEmpresa: string;

  @IsOptional() 
  @IsString() 
  @Matches(/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-Z]$/i, { message: 'El formato del CIF no es válido' })
  cif?: string;

  // ============================================
  // LOCALIZACIÓN COMPLETA
  // ============================================
  @IsOptional() 
  @IsString() 
  direccion?: string;

  @IsOptional() 
  @IsString() 
  poblacion?: string;

  @IsOptional() 
  @IsString() 
  provincia?: string;

  @IsOptional() 
  @IsString() 
  pais?: string;

  @IsOptional()
  @Matches(/^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/, { message: 'El código postal debe tener 5 dígitos válidos de España' })
  codigoPostal?: string;

  // ============================================
  // CONTACTO CORPORATIVO Y PERSONAL
  // ============================================
  @IsOptional() 
  @IsEmail({}, { message: 'El email corporativo no tiene un formato válido' }) 
  email?: string;

  @IsString({ message: 'El nombre de contacto debe ser una cadena de texto' })
  @IsOptional()
  @MinLength(2, { message: 'El nombre de contacto es demasiado corto' })
  @MaxLength(80, { message: 'El nombre de contacto es demasiado largo' })
  // Regex: Permite letras, tildes, ñ y espacios. Bloquea números y símbolos.
  @Matches(/^[a-zA-Zà-ÿÀ-ßñÑ\s]+$/, {
    message: 'El nombre de contacto solo puede contener letras y espacios',
  })
  // Saneamiento: Elimina espacios extra y capitaliza la primera letra de cada palabra
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  })
  @Expose()
  nombreContacto?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsPhoneNumber('ES', { 
    message: 'El teléfono de contacto debe ser un número válido de España (ej: +34 600 000 000)' 
  })
  // Limpieza total: elimina espacios, guiones y paréntesis para la base de datos
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/[\s\(\)\-]/g, '') : value)
  @Expose()
  telefonoContacto?: string;

 @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsPhoneNumber('ES', { 
    message: 'El teléfono de la empresa debe ser un número válido de España (ej: 912345678 o +34 600000000)' 
  })
  // Normalización: Elimina espacios, guiones y paréntesis para un guardado limpio en BD
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/[\s\(\)\-]/g, '') : value)
  @Expose()
  telefonoEmpresa?: string;

  // ============================================
  // ADMINISTRADOR (Objeto Anidado)
  // ============================================
  @Expose()
  @IsObject({ message: 'Los datos del administrador deben ser un objeto válido' })
  @IsNotEmpty({ message: 'Los datos del administrador son obligatorios para el setup' })
  @ValidateNested()
  // Indispensable para que class-transformer sepa a qué clase convertir el objeto plano
  @Type(() => CreateAdminDto) 
  admin: CreateAdminDto;
}