import { Controller, Post, Body, Res } from '@nestjs/common';
import * as Express from 'express'; // Importación como namespace
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

 @Post('login')
async login(
  @Body() loginDto: LoginDto,
  @Res({ passthrough: true }) response: Express.Response,
) {
  const { access_token, user } = await this.authService.login(loginDto);

  // 1. La cookie se envía "por debajo" (invisible para el JS del front)
  response.cookie('jwt', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24,
    path: '/',
  });

  // 2. Devolvemos el token también en el body para verlo en Postman
  return { 
    message: 'Login correcto',
    user,
    access_token // <--- Añade esto aquí para verlo en el JSON
  };
}


@Post('logout')
async logout(@Res({ passthrough: true }) response: Express.Response) {
  // Limpiamos la cookie 'jwt'
  response.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/', // Es vital que el path coincida exactamente con el del login
  });

  return { 
    message: 'Sesión cerrada correctamente' 
  };
}

}