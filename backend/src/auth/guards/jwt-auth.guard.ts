import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// El JwtAuthGuard es un guard que extiende el AuthGuard de Passport para implementar la estrategia de autenticación JWT. Este guard se utiliza para proteger los endpoints que requieren autenticación, asegurándose de que solo los usuarios con un token JWT válido puedan acceder a esos recursos. Al extender AuthGuard('jwt'), el JwtAuthGuard se integra automáticamente con la estrategia JWT configurada en el módulo de autenticación, lo que facilita la implementación de la seguridad en los controladores y servicios del sistema.
/**
 * * * JwtAuthGuard
 *  * * Es un guard que extiende el AuthGuard de Passport para implementar la estrategia de autenticación JWT. Este guard se utiliza para proteger los endpoints que requieren autenticación, asegurándose de que solo los usuarios con un token JWT válido puedan acceder a esos recursos. Al extender AuthGuard('jwt'), el JwtAuthGuard se integra automáticamente con la estrategia JWT configurada en el módulo de autenticación, lo que facilita la implementación de la seguridad en los controladores y servicios del sistema.
 * */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
