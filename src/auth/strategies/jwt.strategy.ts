// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'miSecretoSuperSecreto',
    });
  }

  async validate(payload: any) {
    const { sub } = payload;
    
    const user = await this.userRepository.findOne({
      where: { id: sub },
      relations: ['empresa'], 
    });

    if (!user) throw new UnauthorizedException('Token no válido');
    if (!user.isActive) throw new UnauthorizedException('Usuario inactivo');

    return user; // Este objeto es el que recibe el decorador @GetUser
  }
}