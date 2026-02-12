import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from 'auth/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // Instanciamos el Logger de Nest con el contexto de esta clase
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
  // 1. Extraemos el ID (sub). 
  // Ojo: Si al firmar el token no pusiste 'email', aquí será undefined.
  const { sub: id } = payload; 

  if (!id) {
    this.logger.warn('Validation failed: Payload is missing "sub"');
    throw new UnauthorizedException('Token inválido');
  }

  // 2. Buscamos en DB
  const user = await this.userRepository.findOne({
    where: { id },
    select: ['id', 'email', 'rol', 'dni', 'empresaId', 'isActive'],
  });

  if (!user) {
    this.logger.error(`User ID ${id} no existe en DB`);
    throw new UnauthorizedException('Usuario no encontrado');
  }

  if (!user.isActive) {
    this.logger.warn(`Intento de acceso: Cuenta desactivada para ${user.email}`);
    throw new UnauthorizedException('Cuenta desactivada');
  }

  // 3. LOG PROFESIONAL
  // Usamos 'user.email' (de la DB) en lugar de 'payload.email' para asegurar que existe
  this.logger.log(`[AUTH] Usuario validado: ${user.email} | Rol: ${user.rol}`);

  // 4. EL RETORNO (Lo que recibe @GetUser)
  return {
    id: user.id,       
    email: user.email, 
    rol: user.rol,
    dni: user.dni,
    empresaId: user.empresaId,
  };
}
}