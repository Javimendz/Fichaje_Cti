import { Module } from '@nestjs/common';
import { AllowedPhonesService } from './allowed-phones.service';
import { AllowedPhonesController } from './allowed-phones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllowedPhone } from './entities/allowed-phone.entity';

@Module({

  imports: [

    TypeOrmModule.forFeature([AllowedPhone]),

  ],

  controllers: [AllowedPhonesController],
  providers: [AllowedPhonesService],
  exports: [AllowedPhonesService],
})
export class AllowedPhonesModule {}
