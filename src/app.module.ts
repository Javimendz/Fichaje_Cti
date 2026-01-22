import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CheckinsModule } from './checkins/checkins.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AlarmsModule } from './alarms/alarms.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AllowedPhonesModule } from './allowed-phones/allowed-phones.module';
import { SeedModule } from 'seed/seed.module';
import { EmpresasModule } from './empresas/empresas.module';
import { RolesModule } from './roles/roles.module';
import { CodigoAccesoModule } from './codigo-acceso/codigo-acceso.module';
import { SchedulesModule } from './schedules/schedules.module';
import { JornadaModule } from './jornada/jornada.module';
import { FranjasHorariasModule } from './franja-horaria/franja-horaria.module';
import { AusenciasModule } from './ausencia/ausencia.module';
import { AllowedUserModule } from './allowed-user/allowed-user.module';
import { SolicitudesModule } from './solicitud/solicitud.module';

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
    UsersModule, 
    CheckinsModule, 
    AttendanceModule, 
    FranjasHorariasModule,
    SchedulesModule,
    AusenciasModule,
    AlarmsModule, 
    SeedModule, EmpresasModule, RolesModule, CodigoAccesoModule, SchedulesModule, JornadaModule, FranjasHorariasModule, AusenciasModule, AllowedUserModule, SolicitudesModule
   
   ],
  
})
export class AppModule {}
