// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'auth/entities/user.entity';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'miSecretoSuperSecreto',
    });
  }

async validate(payload: any) {
  // 1. Extraemos el empresaId que acabas de añadir al payload
  const { sub, rol, empresaId } = payload; 

  // 2. Buscamos al usuario en la DB para validar su estado actual
  const user = await this.userRepository.findOneBy({ id: sub });

  if (!user) throw new UnauthorizedException('Token no válido');
  if (!user.isActive) throw new UnauthorizedException('Usuario inactivo');

  // 3. RETORNAMOS el objeto que el decorador @GetUser leerá
  // Es vital incluir empresaId aquí para que el controlador lo vea
  return {
    id: user.id,
    rol: user.rol,
    email: user.email,
    dni: user.dni,
    empresaId: user.empresaId || empresaId // Usamos el de la DB o el del token
  };
}
}