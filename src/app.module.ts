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

@Module({
  imports: [AuthModule, UsersModule, CheckinsModule, AttendanceModule, ShiftsModule, AlarmsModule, LocationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
