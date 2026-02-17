import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { WorkerController } from './worker.controller';
import { Worker } from './entities/worker.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'auth/auth.module';

// El módulo de Worker se encarga de gestionar los trabajadores dentro del sistema. Incluye la entidad Worker, el servicio WorkerService que contiene la lógica de negocio, y el controlador WorkerController que maneja las solicitudes HTTP relacionadas con los trabajadores. Además, importa el AuthModule para manejar la autenticación y autorización, y la entidad Worker para gestionar las relaciones entre trabajadores y otros módulos del sistema. El módulo exporta el WorkerService para que pueda ser utilizado en otros módulos del sistema.
/**
 * * * WorkerModule
 * * Gestiona los trabajadores dentro del sistema. Incluye la entidad Worker, el servicio WorkerService que contiene la lógica de negocio, y el controlador WorkerController que maneja las solicitudes HTTP relacionadas con los trabajadores. Además, importa el AuthModule para manejar la autenticación y autorización, y la entidad Worker para gestionar las relaciones entre trabajadores y otros módulos del sistema. El módulo exporta el WorkerService para que pueda ser utilizado en otros módulos del sistema.
 * * Este módulo es fundamental para la gestión de los trabajadores dentro del sistema, ya que cada trabajador está asociado a una empresa y tiene un rol específico. La gestión de los trabajadores incluye la creación, actualización, eliminación y consulta de trabajadores, y todas estas operaciones deben ser controladas estrictamente en función del rol del usuario que realiza la acción (SuperAdmin o Admin). El módulo delega toda la lógica de negocio y validación al WorkerService, manteniendo el controlador limpio y enfocado en manejar las solicitudes HTTP y la seguridad de acceso.
 * */
@Module({
  imports: [TypeOrmModule.forFeature([Worker]), AuthModule],
  controllers: [WorkerController],
  providers: [WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}
