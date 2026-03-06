import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { Company } from './entities/company.entity';

import { AuthModule } from 'auth/auth.module';
import { User } from 'auth/entities/user.entity';

// 
// El módulo de Company se encarga de gestionar las empresas dentro del sistema. Incluye la entidad Company, el servicio CompanyService que contiene la lógica de negocio, y el controlador CompanyController que maneja las solicitudes HTTP relacionadas con las empresas. Además, importa el AuthModule para manejar la autenticación y autorización, y la entidad User para gestionar las relaciones entre empresas y usuarios.
/**
 * * CompanyModule
 * * Gestiona las empresas dentro del sistema. Incluye la entidad Company, el servicio CompanyService que contiene la lógica de negocio, y el controlador CompanyController que maneja las solicitudes HTTP relacionadas con las empresas. Además, importa el AuthModule para manejar la autenticación y autorización, y la entidad User para gestionar las relaciones entre empresas y usuarios.
 *  * * Este módulo es fundamental para la estructura del sistema, ya que cada empresa puede tener múltiples usuarios asociados (Admins y Workers), y la gestión de estas empresas es una tarea crítica que debe ser controlada estrictamente, especialmente en lo que respecta a la creación, actualización y eliminación de empresas. El módulo delega toda la lógica de negocio y validación al CompanyService, manteniendo el controlador limpio y enfocado en manejar las solicitudes HTTP y la seguridad de acceso.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Company, User, Company]), AuthModule],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService, TypeOrmModule],
})
export class CompanyModule {}