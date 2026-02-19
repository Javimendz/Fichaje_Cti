import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';


// 🟢 AttendanceService
// Servicio para gestionar la lógica de negocio relacionada con las asistencias (fichajes) de los trabajadores.
/**
 * AttendanceService
 * Servicio para gestionar la lógica de negocio relacionada con las asistencias (fichajes) de los trabajadores.
 * Incluye métodos para crear un nuevo registro de asistencia, obtener el historial de asistencias de un trabajador específico y obtener todas las asistencias de una empresa.
 * El método create permite a un trabajador registrar su asistencia (presente o ausente con motivo) vinculando automáticamente el registro con el ID del usuario autenticado.
 * El método findAllByUser devuelve todas las asistencias registradas por un trabajador específico, ordenadas por fecha (más reciente primero).
 * El método findAllByEmpresa devuelve todas las asistencias registradas por los trabajadores de una empresa específica, ordenadas por fecha (más reciente primero) y con información del usuario que realizó cada fichaje.
 * Este servicio es esencial para el sistema de fichaje, ya que permite a los trabajadores registrar su asistencia y a los administradores revisar el historial de asistencias de su empresa.
 * */
@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  // --- CREAR ASISTENCIA: ADMIN Y WORKER ---
  /* Método para que un trabajador registre su asistencia.
    * El trabajador puede marcarse como presente o ausente con un motivo.
    * El sistema vincula automáticamente el registro con el ID del usuario autenticado.
    * Solo los usuarios con rol ADMIN o WORKER pueden acceder a este método para registrar asistencias, excluyendo a los superadministradores que no deberían tener esta función.
    */
  async create(usuarioId: number, dto: CreateAttendanceDto) {
    const record = this.attendanceRepository.create({
      presente: dto.presente,
      motivo: dto.motivo,
      usuario: { id: usuarioId } as any // Vinculación directa por ID
      // Si en la entidad tienes 'empresaId', deberías pasarlo aquí también para facilitar las búsquedas
    });
    
    return await this.attendanceRepository.save(record);
  }

  // --- HISTORIAL PERSONAL: ADMIN Y WORKER ---
  /* Método para que un trabajador vea su propio historial de asistencias.
    * El sistema devuelve todas las asistencias registradas por el usuario autenticado, ordenadas por fecha (más reciente primero).     
    *   @Roles(UserRole.ADMIN, UserRole.WORKER) permite que tanto los trabajadores como los administradores puedan revisar su historial personal de asistencias, lo cual es útil para que los administradores también puedan verificar sus propios registros.
    */
  async findAllByUser(usuarioId: number) {
    return await this.attendanceRepository.find({
      where: { usuario: { id: usuarioId } },
      order: { fecha: 'DESC' }, 
    });
  }


  // --- HISTORIAL DE EMPRESA: SOLO ADMIN ---
  /* Método para que un administrador vea todas las asistencias de su empresa.
    * El sistema devuelve todas las asistencias registradas por los trabajadores de la empresa del administrador autenticado, ordenadas por fecha (más reciente primero).
    * Solo los usuarios con rol ADMIN pueden acceder a este método para revisar el historial de asistencias de su empresa, asegurando que los trabajadores no puedan ver los registros de otros empleados.
    * @Roles(UserRole.ADMIN) garantiza que solo los administradores puedan acceder a este método, protegiendo la privacidad de los trabajadores y asegurando que solo el personal autorizado pueda revisar los registros de asistencia de la empresa.
    */
  async findAllByEmpresa(empresaId: number) {
    return await this.attendanceRepository.find({
      // Hacemos un JOIN con el usuario para filtrar por su empresaId
      where: { 
        usuario: { empresaId: empresaId } 
      },
      relations: ['usuario'], // Traemos el usuario para que el admin sepa quién fichó
      order: { fecha: 'DESC' }, 
    });
  }
}