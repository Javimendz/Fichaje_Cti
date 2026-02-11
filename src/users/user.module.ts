import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { AllowedPhonesModule } from 'allowed-phones/allowed-phones.module';
import { Company } from 'company/entities/company.entity';
import { CompanyModule } from 'company/company.module';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AllowedPhonesModule, CompanyModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService,TypeOrmModule],
})
export class UserModule {}