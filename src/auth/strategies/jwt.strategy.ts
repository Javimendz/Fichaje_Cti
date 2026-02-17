import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from 'auth/entities/user.entity';

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

  async validate(payload: any) {
    const { sub: id } = payload;

    if (!id) {
      throw new UnauthorizedException('Token inválido: falta sub');
    }

    // Buscamos al usuario y su empresa
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

    // --- LOG DE SEGURIDAD ---
    // Aquí confirmamos que marta.admin tiene empresaId: 1
    const empresaIdFinal = user.empresa ? user.empresa.id : null;
    
    console.log(`[AUTH] Validando: ${user.email} | Empresa ID: ${empresaIdFinal}`);

    // Este objeto es el que llega al decorador @GetUser()
    return {
      id: user.id,
      email: user.email,
      rol: user.rol,
      dni: user.dni,
      // Mapeamos el ID de la relación al nombre que espera tu controlador
      empresaId: empresaIdFinal, 
    };
  }
}