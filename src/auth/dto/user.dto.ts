import { Expose } from 'class-transformer';

export class UserDto {
  @Expose()
  id: number;

  @Expose()
  nombre: string;

  @Expose()
  email: string;

  @Expose()
  rol: string;
}