import { Module, forwardRef } from '@nestjs/common';
import { AllowedPhonesService } from './allowed-phones.service';
import { AllowedPhonesController } from './allowed-phones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllowedPhone } from './entities/allowed-phone.entity';
import { AuthModule } from 'auth/auth.module';

@Module({

  imports: [

    TypeOrmModule.forFeature([AllowedPhone]),
    forwardRef(() => AuthModule),
  ],

  controllers: [AllowedPhonesController],
  providers: [AllowedPhonesService],
  exports: [AllowedPhonesService],
})
export class AllowedPhonesModule {}
