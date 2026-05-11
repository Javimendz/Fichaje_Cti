import { Module } from '@nestjs/common';
import { IssueSiteService } from './issue-site.service';
import { IssueSiteController } from './issue-site.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueSite } from './entities/issue-site.entity';
import { Site } from '../site/entities/site.entity'; //
import { User } from '../auth/entities/user.entity';

@Module({
imports: [
    // 🚩 AÑADE 'User' a esta lista:
    TypeOrmModule.forFeature([IssueSite, Site, User]), 
  ],
  controllers: [
    IssueSiteController
  ],
  providers: [
    IssueSiteService
  ],
  exports: [
    // Exportamos el servicio por si quieres usarlo en otros módulos 
    // (ej: para contar incidencias desde el panel principal)
    IssueSiteService 
  ],
})
export class IssueSiteModule {}
