import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AllowedPhonesModule } from 'allowed-phones/allowed-phones.module';
import { AllowedUser } from 'allowed-user/entities/allowed-user.entity';

@Module({
  imports: [
    // 1. Configuración de Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // 2. Entidades
    TypeOrmModule.forFeature([User, AllowedUser]),
    
    // 3. Dependencias circulares o externas
    forwardRef(() => AllowedPhonesModule),
    
    // 4. Configuración de JWT
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'miSecretoSuperSecreto',
      signOptions: { expiresIn: '24h' }, // 1h suele ser poco para testing, 24h es más cómodo
    }),
  ],
  providers: [
    AuthService, 
    JwtStrategy
    // Nota: El RolesGuard no suele ponerse aquí si se usa como Guard global o por controller
  ],
  controllers: [AuthController],
  exports: [
    AuthService, 
    JwtModule, 
    PassportModule, // ¡CRÍTICO! Exportar para que JwtAuthGuard funcione en otros módulos
    JwtStrategy,     // Exportar para que otros módulos validen el token
    TypeOrmModule, // Exportar para que otros módulos usen UserRepository
  ],
})
export class AuthModule {}