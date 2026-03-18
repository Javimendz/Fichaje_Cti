import { Module } from '@nestjs/common';
import { IssueService } from './issue.service';
import { IncidenciaController } from './issue.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './entities/issue.entity';
import { Company } from 'company/entities/company.entity';
import { ConfigModule } from '@nestjs/config';

/**
 *  Módulo para la gestión de incidencias
 * 
 * Este módulo proporciona las funcionalidades necesarias para la gestión de incidencias,
 * como la creación, actualización, resolución y consulta de incidencias. 
 */
@Module({
  imports: [ConfigModule,
      TypeOrmModule.forFeature([Issue, Company])

  ],
  controllers: [IncidenciaController],
  providers: [IssueService],
  exports: [IssueService]
})
export class IssueModule {}
