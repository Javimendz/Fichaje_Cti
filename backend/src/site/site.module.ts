import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';

// 1. Importa las entidades necesarias
import { Site } from './entities/site.entity';
import { SiteLog } from '../siteLog/entities/siteLog.entity'; // O donde esté tu SiteLog
import { IssueSite } from '../issue-site/entities/issue-site.entity'; // 🚩 Esta es la que falta
import { Worker } from '../worker/entities/worker.entity'; 
@Module({
  imports: [
    // 🚩 REGISTRO: Aquí es donde NestJS busca los repositorios
    TypeOrmModule.forFeature([
      Site, 
      SiteLog, 
      IssueSite, 
      Worker 
    ]),
  ],
  controllers: [SiteController],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}