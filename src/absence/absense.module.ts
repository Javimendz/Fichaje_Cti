import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ausencia } from './entities/ausencia.entity';
import { AbsenceService } from './absence.service';
import { AbsenceController } from './absence.controller';


// El módulo de Absence se encarga de gestionar las ausencias de los trabajadores. Incluye el servicio AbsenceService que contiene la lógica de negocio relacionada con las ausencias, y el controlador AbsenceController que maneja las solicitudes HTTP relacionadas con las ausencias, como crear, actualizar, listar y eliminar ausencias. Además, importa el TypeOrmModule para manejar la entidad Ausencia y sus operaciones en la base de datos. El módulo exporta el AbsenceService y el TypeOrmModule para que puedan ser utilizados en otros módulos del sistema.
/**
 * * * AbsenceModule
 * * Gestiona las ausencias de los trabajadores. Incluye el servicio AbsenceService que contiene la lógica de negocio relacionada con las ausencias, y el controlador AbsenceController que maneja las solicitudes HTTP relacionadas con las ausencias, como crear, actualizar, listar y eliminar ausencias. Además, importa el TypeOrmModule para manejar la entidad Ausencia y sus operaciones en la base de datos. El módulo exporta el AbsenceService y el TypeOrmModule para que puedan ser utilizados en otros módulos del sistema.
 * */
@Module({
  imports: [TypeOrmModule.forFeature([Ausencia])],
  controllers:  [AbsenceController],
  providers: [AbsenceService],
  exports: [AbsenceService,TypeOrmModule],
})
export class AbsenceModule {}
