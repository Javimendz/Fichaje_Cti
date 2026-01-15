import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CheckinsModule } from './checkins/checkins.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ShiftsModule } from './shifts/shifts.module';
import { AlarmsModule } from './alarms/alarms.module';
import { LocationsModule } from './locations/locations.module';
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
        synchronize: false,
        extra: {
           timezone: 'UTC', // Esto asegura que el driver use UTC
        },
       entities: [__dirname + '/**/*.entity{.ts,.js}'],



    }),
    AuthModule, 
    AllowedPhonesModule,
    UsersModule, 
    CheckinsModule, 
    AttendanceModule, 
    ShiftsModule, 
    AlarmsModule, 
    SeedModule, EmpresasModule, RolesModule, CodigoAccesoModule, SchedulesModule, JornadaModule, FranjasHorariasModule, AusenciasModule, AllowedUserModule
   
   ],
  
})
export class AppModule {}
