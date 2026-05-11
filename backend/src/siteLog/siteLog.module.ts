import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteLogService } from './siteLog.service';
import { SiteLogController } from './siteLog.controller';
import { SiteLog } from './entities/siteLog.entity'; // Asegúrate de que la ruta es correcta
import { Site } from '../site/entities/site.entity'; // También necesitas la de Site por el index [1]
import { SiteLogBreak } from './entities/siteLogBreak.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SiteLog, Site, SiteLogBreak]), 
  ],
  controllers: [SiteLogController],
  providers: [SiteLogService],
  exports: [SiteLogService], // Por si otros módulos necesitan usar este servicio
})
export class SiteLogModule {}