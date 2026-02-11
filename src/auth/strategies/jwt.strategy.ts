// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'auth/entities/user.entity';
import { Strategy } from 'passport-jwt'; 
import { Repository } from 'typeorm';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        let token = null;
        
        // --- LOG DE COOKIES ---
        console.log('--- Nueva Petición Recibida ---');
        console.log('Cookies presentes en la request:', req.cookies);

        if (req && req.cookies) {
          token = req.cookies['jwt'];
        }

        console.log('Token extraído de la cookie:', token ? '✅ TOKEN ENCONTRADO' : '❌ TOKEN NO ENCONTRADO');
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'miSecretoSuperSecreto',
    });
  }

  async validate(payload: any) {
    // --- LOG DE PAYLOAD ---
    console.log('Validando Payload del JWT:', payload);

    const { sub } = payload; 
    const user = await this.userRepository.findOneBy({ id: sub });

    if (!user) {
      console.log(' Validación fallida: Usuario no existe en DB');
      throw new UnauthorizedException('Token no válido');
    }

    if (!user.isActive) {
      console.log(' Validación fallida: Usuario inactivo');
      throw new UnauthorizedException('Usuario inactivo');
    }

    console.log(' Usuario validado con éxito:', user.email);

    return {
      id: user.id,
      rol: user.rol,
      email: user.email,
      dni: user.dni,
      empresaId: user.empresaId 
    };
  }
}