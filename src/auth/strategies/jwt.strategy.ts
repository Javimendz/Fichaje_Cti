// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'miSecretoSuperSecreto',
    });
  }

  async validate(payload: any) {
    // Lo que retornes aquí se inyectará en req.user
    // Incluimos empresaId (que será null para Superadmins)
    return { 
      userId: payload.sub, 
      dni: payload.dni, 
      rol: payload.rol, 
      empresaId: payload.empresaId || null 
    };
  }
}