import { IsString, IsNotEmpty } from 'class-validator';

export class LoginMasterDto {
  @IsString()
  @IsNotEmpty()
  masterPassword: string;
}