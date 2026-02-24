import { 
  IsNotEmpty, IsString, IsEmail, IsOptional, MinLength, 
  MaxLength, Matches, IsNumber, ValidateIf, IsEnum 
} from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { UserRole } from 'auth/roles.enum';
import { UserBaseDto } from './user-base.dto';

export class CreateUserDto extends UserBaseDto {
  // --- CAMPOS COMUNES ---
 

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(20, { message: 'La contraseña no puede superar los 20 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe incluir mayúsculas, minúsculas y números'
  })
  // 🛡️ CORRECCIÓN: NUNCA se transforman ni se pasan a minúsculas las contraseñas
  @Expose()
  password?: string;
@IsNotEmpty({ message: 'El rol es obligatorio' })
  @IsEnum(UserRole, { message: 'Rol inválido' })
  @Expose()
  declare rol: any;

  @IsNotEmpty({ message: 'El email es un campo obligatorio' })
  @IsEmail({}, { message: 'El formato del email no es válido' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @Expose()
  declare email: string;
  // --- CAMPOS DEPENDIENTES DEL ROL ---

  // El empresaId es obligatorio para todos, EXCEPTO si un SuperAdmin crea otro SuperAdmin (si tu lógica lo permite)
  @IsOptional() 
  @IsNumber()
  @Type(() => Number) // 🛡️ CORRECCIÓN: Forzamos a que siempre llegue como Número a la BD
  @Expose()
  empresaId?: number;

  @ValidateIf(o => o.rol === UserRole.WORKER)
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  horarioId?: number;
}