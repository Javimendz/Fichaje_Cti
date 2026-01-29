import { UserDto } from 'auth/dto/user.dto';
import { Expose, Type } from 'class-transformer';


export class AttendanceDto {
  @Expose()
  id: number;

  @Expose()
  fecha: Date;

  @Expose()
  presente: boolean;

  @Expose()
  motivo: string;

  @Expose()
  usuarioId: string;

  @Expose()
  @Type(() => UserDto) // Transforma la relación en el DTO de usuario
  usuario: UserDto;
}