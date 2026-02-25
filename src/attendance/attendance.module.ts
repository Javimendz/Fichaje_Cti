import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AuthModule } from 'auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { AlarmsService } from 'alarms/alarms.service';
import { AlarmsModule } from 'alarms/alarms.module';
import { User } from 'auth/entities/user.entity';


// 🟢 AttendanceModule
// Módulo para gestionar las asistencias (fichajes) de los trabajadores.
/**
 * AttendanceModule
 * Módulo para gestionar las asistencias (fichajes) de los trabajadores.
 * Incluye el AttendanceController para manejar las solicitudes HTTP relacionadas con las asistencias y el AttendanceService para la lógica de negocio.
 * Importa el AuthModule para utilizar la autenticación y autorización en los endpoints de asistencia, asegurando que solo usuarios autenticados con los roles adecuados puedan acceder a las funcionalidades de registro y consulta de asistencias.
 * Utiliza TypeOrmModule para integrar la entidad Attendance con la base de datos, permitiendo realizar operaciones CRUD sobre los registros de asistencia.
 * Este módulo es esencial para el sistema de fichaje, ya que permite a los trabajadores registrar su asistencia y a los administradores revisar el historial de asistencias de su empresa.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance]),
    AuthModule, User,
    AlarmsModule 
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService], 
})
export class AttendanceModule {}
