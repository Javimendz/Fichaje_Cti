import { 
  IsNotEmpty, IsString, IsEmail, IsOptional, MinLength, 
  MaxLength, Matches, IsNumber, ValidateIf, 
  IsPositive, IsInt,
  IsEnum
} from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { UserRole } from '../../auth/roles.enum';
import { UserBaseDto } from './user-base.dto';

export class CreateUserDto extends UserBaseDto {
  // --- CONTRASEÑA (Opcional) ---
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(20, { message: 'La contraseña no puede superar los 20 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe incluir mayúsculas, minúsculas y números'
  })
  @Expose()
  password?: string;
  

  @IsEnum(UserRole)
  @IsOptional()
  rol: UserRole = UserRole.WORKER;
 

  // --- EMPRESA ID (Opcional - el Service maneja la lógica) ---
  @IsOptional()
  @IsNumber({}, { message: 'El ID de empresa debe ser un número' })
  @IsPositive({ message: 'El ID de empresa debe ser un número positivo' })
  @Type(() => Number)
  @Expose()
  empresaId?: number;

@IsOptional()
  @IsInt()
  @IsPositive()
  @Expose()  
  @Type(() => Number)
  actividadId?: number;

  // --- HORARIO ID (Opcional - solo para Workers) ---
  @ValidateIf(o => o.rol === UserRole.WORKER)
  @IsOptional()
  @IsInt({ message: 'El ID de horario debe ser un número entero' })
  @IsPositive({ message: 'El ID de horario debe ser positivo' })
  @IsNumber({}, { message: 'El ID de horario debe ser un número' })
  @Type(() => Number)
  @Expose()
  horarioId?: number;
}