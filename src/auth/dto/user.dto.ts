import { Expose } from 'class-transformer';

export class UserDto {
  @Expose()
  id: string;

  @Expose()
  nombre: string;

  @Expose()
  email: string;

  @Expose()
  rol: string;
}