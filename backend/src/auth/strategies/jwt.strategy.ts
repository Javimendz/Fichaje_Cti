import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

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


// src/auth/strategies/jwt.strategy.ts

async validate(payload: any) {
  const { sub: id } = payload;

  // 🚩 1. NUEVO: Si es un token de configuración, no buscamos en DB
  if (id === 'COMPANY_CONFIG') {
    return {
      id: 0,
      email: payload.email,
      rol: payload.rol,
      nombre: payload.nombre,
      apellido: payload.apellido,
      empresaId: payload.empresaId, // 👈 Esto es lo que necesita activatePin
      isConfigMode: true, 
    };
  }

  // 2. Validación normal para usuarios reales
  if (!id) {
    throw new UnauthorizedException('Token inválido: falta sub');
  }

  const user = await this.userRepository.findOne({
    where: { id },
    relations: ['empresa'], 
  });

  if (!user) {
    this.logger.error(`User ID ${id} no existe en DB`);
    throw new UnauthorizedException('Usuario no encontrado');
  }

  if (!user.isActive) {
    throw new UnauthorizedException('Cuenta desactivada');
  }

  const empresaIdFinal = user.empresa ? user.empresa.id : null;
  console.log(`[AUTH] Validando: ${user.email} | Empresa ID: ${empresaIdFinal}`);

  return {
    id: user.id,
    email: user.email,
    rol: user.rol,
    dni: user.dni,
    nombre: user.nombre,
    apellido: user.apellidos,
    horarioId: user.horarioId,
    empresaId: empresaIdFinal, 
  };
}
}