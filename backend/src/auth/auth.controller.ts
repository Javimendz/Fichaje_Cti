import { Controller, Post, Body, Res, Get, UseGuards } from '@nestjs/common';
import * as Express from 'express'; 
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GetUser } from 'auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';


/** 
 * * * * AuthController
 * * * Gestiona la autenticación de usuarios en el sistema. Incluye endpoints para login, logout y obtener los datos del usuario autenticado. El controlador utiliza el AuthService para manejar la lógica de negocio relacionada con la autenticación, como validar las credenciales de los usuarios, generar tokens JWT, y gestionar las sesiones de los usuarios a través de cookies. El controlador también utiliza el decorador GetUser para obtener los datos del usuario autenticado en los endpoints que lo requieren, y el guard JwtAuthGuard para proteger los endpoints que requieren autenticación. Este controlador es fundamental para garantizar la seguridad del sistema y controlar el acceso a los recursos protegidos.
 * */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --- LOGIN ---
  // El endpoint de login ahora devuelve el token JWT tanto en una cookie HTTP-only como en el cuerpo de la respuesta. Esto permite que el token sea utilizado fácilmente en Postman para pruebas, mientras que en un entorno de producción el front-end puede optar por usar la cookie para mantener la sesión del usuario sin necesidad de almacenar el token en localStorage, lo que mejora la seguridad al reducir el riesgo de ataques XSS.
    /**
     * * @param loginDto DTO que contiene las credenciales de inicio de sesión (email y password).
     * * @param response Objeto de respuesta de Express utilizado para establecer la cookie con el token JWT.
     * * @returns Un objeto que incluye un mensaje de éxito, los datos del usuario autenticado, y el token JWT. El token también se establece en una cookie HTTP-only para su uso en entornos de producción.
     * * Este endpoint maneja el proceso de inicio de sesión de los usuarios. Recibe las credenciales del usuario a través del DTO LoginDto, y utiliza el AuthService para validar las credenciales y generar un token JWT si son correctas. El token se devuelve tanto en el cuerpo de la respuesta como en una cookie HTTP-only, lo que permite su uso en Postman para pruebas y mejora la seguridad en entornos de producción al evitar el almacenamiento del token en localStorage. Si las credenciales son incorrectas, se lanzará una excepción que será manejada por el AuthService.
     * */
 @Post('login')
async login(
  @Body() loginDto: LoginDto,
  @Res({ passthrough: true }) response: Express.Response,
) {
const { access_token, refresh_token, user } = await this.authService.login(loginDto);
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
    access_token ,// <--- Añade esto aquí para verlo en el JSON
    refresh_token
  };
}

// --- LOGOUT ---
// El endpoint de logout ahora limpia la cookie 'jwt' estableciendo su valor a una cadena vacía y su fecha de expiración a una fecha pasada. Esto asegura que la cookie se elimine correctamente en el navegador del cliente, cerrando efectivamente la sesión del usuario. Además, se devuelve un mensaje de éxito en el cuerpo de la respuesta para confirmar que la sesión se ha cerrado correctamente.
/**
 * * @param response Objeto de respuesta de Express utilizado para limpiar la cookie 'jwt' que contiene el token de autenticación.    
 *  * @returns Un mensaje de éxito indicando que la sesión se ha cerrado correctamente. La cookie 'jwt' se limpia estableciendo su valor a una cadena vacía y su fecha de expiración a una fecha pasada, lo que asegura que el navegador del cliente elimine la cookie y cierre la sesión del usuario.
 * * Este endpoint maneja el proceso de cierre de sesión de los usuarios. Al acceder a este endpoint, se limpia la cookie 'jwt' que contiene el token de autenticación, lo que efectivamente cierra la sesión del usuario en el cliente. Además, se devuelve un mensaje de éxito en el cuerpo de la respuesta para confirmar que la sesión se ha cerrado correctamente. Si ocurre algún error durante el proceso de logout, se lanzará una excepción que será manejada por el AuthService. 
 *  */
@Post('logout')
  @UseGuards(JwtAuthGuard) // Protegemos el logout para saber quién es
  async logout(
    @GetUser() user: any, 
    @Res({ passthrough: true }) response: Express.Response
  ) {
    // 1. Borramos el token de la Base de Datos
    await this.authService.logout(user.userId || user.id); // Asegúrate de pasar el ID correcto según tu decorador

    // 2. Limpiamos la cookie
    response.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Sesión cerrada correctamente' };
  }

@Get('me')
@UseGuards(JwtAuthGuard)
async getMe(@GetUser() user: any) {
  // Retornamos los datos básicos para que el front pinte la UI
  // sin necesidad de localStorage
  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    apellido: user.apellido,
    rol: user.rol,
    horarioId: user.horarioId,
    empresaId: user.empresaId
  };
}


@Post('refresh')
async refresh(@Body() body: { userId: number; refreshToken: string }) {
    return this.authService.refreshTokens(body.userId, body.refreshToken);
  }
}