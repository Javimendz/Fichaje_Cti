import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { AllowedPhonesModule } from 'allowed-phones/allowed-phones.module';
import { CompanyModule } from 'company/company.module';
import { UserController } from './user.controller';

// El módulo de User se encarga de gestionar los usuarios dentro del sistema. Incluye la entidad User, el servicio UserService que contiene la lógica de negocio, y el controlador UserController que maneja las solicitudes HTTP relacionadas con los usuarios. Además, importa el AllowedPhonesModule para validar los números de teléfono permitidos, y el CompanyModule para gestionar las relaciones entre usuarios y empresas. El módulo exporta el UserService y el TypeOrmModule para que puedan ser utilizados en otros módulos del sistema.
/**
 * * * UserModule
 * * Gestiona los usuarios dentro del sistema. Incluye la entidad User, el servicio UserService que contiene la lógica de negocio, y el controlador UserController que maneja las solicitudes HTTP relacionadas con los usuarios. Además, importa el AllowedPhonesModule para validar los números de teléfono permitidos, y el CompanyModule para gestionar las relaciones entre usuarios y empresas. El módulo exporta el UserService y el TypeOrmModule para que puedan ser utilizados en otros módulos del sistema.
 * 
 * */

@Module({
  imports: [TypeOrmModule.forFeature([User]), AllowedPhonesModule, CompanyModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService,TypeOrmModule],
})
export class UserModule {}