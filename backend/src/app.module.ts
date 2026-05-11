import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';

// Tus módulos
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AlarmsModule } from './alarms/alarms.module';
import { SeedModule } from './seed/seed.module';
import { CompanyModule } from './company/company.module';
import { ScheduleModule } from './schedule/schedule.module';
import { WorkdayModule } from './workday/workday.module';
import { TimeSlotModule } from './timeSlot/timeSlot.module';
import { AbsenceModule } from './absence/absense.module';
import { WorkerModule } from './worker/worker.module';
import { RequestModule } from './request/request.module';
import { IssueModule } from './issue/issue.module';
import { ActivityModule } from './activity/activity.module';
import { SiteModule } from './site/site.module';
import { SiteLogModule } from './siteLog/siteLog.module';
import { IssueSiteModule } from './issue-site/issue-site.module';
/**
 * 
 * TypeORM Configuration:
 * - type: 'postgres' - Especifica el tipo de base de datos como PostgreSQL.
 * - host, port, database, username, password: Configura los detalles de conexión a la base de datos utilizando variables de entorno.
 * - autoLoadEntities: true - Permite que TypeORM cargue automáticamente las entidades registradas en los módulos.
 * - synchronize: true - Sincroniza el esquema de la base de datos con las entidades cada vez que se inicia la aplicación (útil para desarrollo).
 * - dropSchema: true - Elimina y recrea el esquema de la base de datos en cada inicio de la aplicación (útil para pruebas y desarrollo).
 * - extra: { timezone: 'UTC' } - Configura la zona horaria del driver de la base de datos a UTC para consistencia en el manejo de fechas y horas.
 * - entities: [__dirname + '/**.entity{.ts,.js}'] - Especifica la ruta donde se encuentran las entidades para que TypeORM las cargue.
 * 
 * con process.env.* se accede a las variables de entorno definidas en el sistema o en un archivo .env.
 * 
 * @see https://typeorm.io/data-source-options
 * 
 */

@Module({

  imports: [

    ThrottlerModule.forRoot([{
      ttl: 60000, // Tiempo de vida en milisegundos (1 minuto)
      limit: 5,   // Límite global: 10 peticiones por minuto
    }]),
    ConfigModule.forRoot({

      isGlobal: true,
      envFilePath: '.env',
    }),
    NestScheduleModule.forRoot(),
    TypeOrmModule.forRoot({

      // TypeORM Configuration:
      // - type: 'postgres' - Especifica el tipo de base de datos como PostgreSQL.
      // - host, port, database, username, password: Configura los detalles de conexión a la base de datos utilizando variables de entorno.
      // - autoLoadEntities: true - Permite que TypeORM cargue automáticamente las entidades registradas en los módulos.
      // - synchronize: true - Sincroniza el esquema de la base de datos con las entidades cada vez que se inicia la aplicación (útil para desarrollo).
      // - dropSchema: true - Elimina y recrea el esquema de la base de datos en cada inicio de la aplicación (útil para pruebas y desarrollo).
      // - extra: { timezone: 'UTC' } - Configura la zona horaria del driver de la base de datos a UTC para consistencia en el manejo de fechas y horas.
      // - entities: [__dirname + '/**/*.entity{.ts,.js}'] - Especifica la ruta donde se encuentran las entidades para que TypeORM las cargue.
      // con process.env.* se accede a las variables de entorno definidas en el sistema o en un archivo .env.
      // @see https://typeorm.io/data-source-options
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize:   false,  // process.env.NODE_ENV !== 'production',
      dropSchema: false, // Cambiado a false para evitar pérdida de datos en producción
      extra: {
        timezone: 'UTC',
      },
      entities: [__dirname + '/**/*.entity{.ts,.js}'],



    }),
    AuthModule,

    UserModule,
    AttendanceModule,
    AlarmsModule,
    SeedModule,
    CompanyModule,

    ScheduleModule, // Tu módulo
    WorkdayModule,
    TimeSlotModule,
    AbsenceModule,
    WorkerModule,
    RequestModule,
    IssueModule,
    ActivityModule, SiteModule, SiteLogModule, IssueSiteModule
  ],
  

})
export class AppModule { }
