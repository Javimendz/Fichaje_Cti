import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CheckinsModule } from './checkins/checkins.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ShiftsModule } from './shifts/shifts.module';
import { AlarmsModule } from './alarms/alarms.module';
import { LocationsModule } from './locations/locations.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

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


    }),
    AuthModule, 
    UsersModule, 
    CheckinsModule, 
    AttendanceModule, 
    ShiftsModule, 
    AlarmsModule, 
    LocationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
