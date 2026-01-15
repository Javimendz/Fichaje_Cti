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
    TypeOrmModule.forFeature([User, AllowedUser]),
    PassportModule,
    forwardRef(() => AllowedPhonesModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'miSecretoSuperSecreto',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

