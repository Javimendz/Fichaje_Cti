import { Module } from '@nestjs/common';
import { IssueService } from './issue.service';
import { IncidenciaController } from './issue.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './entities/issue.entity';

/**
 *  Módulo para la gestión de incidencias
 * 
 * Este módulo proporciona las funcionalidades necesarias para la gestión de incidencias,
 * como la creación, actualización, resolución y consulta de incidencias. 
 */
@Module({
  imports: [
      TypeOrmModule.forFeature([Issue])

  ],
  controllers: [IncidenciaController],
  providers: [IssueService],
  exports: [IssueService]
})
export class IssueModule {}
