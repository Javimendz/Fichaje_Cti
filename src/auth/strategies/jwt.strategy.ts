// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'auth/entities/user.entity';
import { Strategy } from 'passport-jwt'; // Quitamos ExtractJwt si no lo usas más
import { Repository } from 'typeorm';
import { Request } from 'express'; // <--- Importante para el tipado

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      // MODIFICACIÓN AQUÍ: Función extractora personalizada
      jwtFromRequest: (req: Request) => {
        let token = null;
        if (req && req.cookies) {
          token = req.cookies['jwt']; // Debe coincidir con el nombre usado en response.cookie()
        }
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'miSecretoSuperSecreto',
    });
  }

  async validate(payload: any) {
    const { sub } = payload; 

    // Buscamos al usuario incluyendo los campos necesarios
    const user = await this.userRepository.findOneBy({ id: sub });

    if (!user) throw new UnauthorizedException('Token no válido');
    if (!user.isActive) throw new UnauthorizedException('Usuario inactivo');

    // Retornamos el objeto para @GetUser()
    return {
      id: user.id,
      rol: user.rol,
      email: user.email,
      dni: user.dni,
      empresaId: user.empresaId 
    };
  }
}