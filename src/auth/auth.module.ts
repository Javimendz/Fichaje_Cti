import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AllowedPhonesModule } from 'allowed-phones/allowed-phones.module';
import { Worker } from 'worker/entities/worker.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';

// El módulo de Auth se encarga de gestionar la autenticación de usuarios en el sistema. Incluye el servicio AuthService que contiene la lógica de negocio relacionada con la autenticación, y el controlador AuthController que maneja las solicitudes HTTP relacionadas con la autenticación, como login y logout. Además, importa el PassportModule para configurar la estrategia de autenticación JWT, el JwtModule para manejar la generación y validación de tokens JWT, y las entidades User y Worker para gestionar las relaciones entre usuarios, trabajadores y otros módulos del sistema. El módulo exporta el AuthService, JwtModule, PassportModule, JwtStrategy y TypeOrmModule para que puedan ser utilizados en otros módulos del sistema.
/**
 * * * AuthModule
 *  
 * * Gestiona la autenticación de usuarios en el sistema. Incluye el servicio AuthService que contiene la lógica de negocio relacionada con la autenticación, y el controlador AuthController que maneja las solicitudes HTTP relacionadas con la autenticación, como login y logout. Además, importa el PassportModule para configurar la estrategia de autenticación JWT, el JwtModule para manejar la generación y validación de tokens JWT, y las entidades User y Worker para gestionar las relaciones entre usuarios, trabajadores y otros módulos del sistema. El módulo exporta el AuthService, JwtModule, PassportModule, JwtStrategy y TypeOrmModule para que puedan ser utilizados en otros módulos del sistema.
 * */
@Module({
  imports: [
    ConfigModule,
    // 1. Configuración de Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // 2. Entidades
    TypeOrmModule.forFeature([User, Worker]),
    
    // 3. Dependencias circulares o externas
    forwardRef(() => AllowedPhonesModule),
    
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'), 
        signOptions: { 
          // Este es el default para el Access Token
          expiresIn: config.get('JWT_ACCESS_EXPIRATION') || '1m' 
        },
      }),
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