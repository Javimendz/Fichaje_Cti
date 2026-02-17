import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AlarmsModule } from './alarms/alarms.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AllowedPhonesModule } from './allowed-phones/allowed-phones.module';
import { SeedModule } from 'seed/seed.module';
import { CompanyModule } from './company/company.module';
import { RolesModule } from './roles/roles.module';
import { CodigoAccesoModule } from './codigo-acceso/codigo-acceso.module';
import { ScheduleModule } from './schedule/schedule.module';
import { WorkdayModule } from './workday/workday.module';
import { TimeSlotModule } from './timeSlot/timeSlot.module';
import { AbsenceModule } from './absence/absense.module';
import { WorkerModule } from './worker/worker.module';
import { RequestModule } from './request/request.module';

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
    ConfigModule.forRoot(),

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
        port:  5432,
        database: process.env.DB_NAME,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        autoLoadEntities: true,
        synchronize: true,
        dropSchema: false,  
        extra: {
           timezone: 'UTC', 
        },
       entities: [__dirname + '/**/*.entity{.ts,.js}'],



    }),
    AuthModule, 
    AllowedPhonesModule,
    UserModule, 
    
    AttendanceModule, 
    TimeSlotModule,
    ScheduleModule,
    AbsenceModule,
    AlarmsModule, 
    SeedModule, CompanyModule, RolesModule, CodigoAccesoModule, ScheduleModule, WorkdayModule, TimeSlotModule, AbsenceModule, WorkerModule, RequestModule
   
   ],
  
})
export class AppModule {}
