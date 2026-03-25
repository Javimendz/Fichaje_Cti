import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UserPayload } from 'auth/interfaces/user-payload.interface';
import { UserRole } from 'auth/roles.enum';


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
  async create(user: UserPayload, dto: CreateAttendanceDto) {
    
    if (!user.empresaId) {
    throw new BadRequestException('No puedes fichar: no tienes una empresa asignada.');
    }
    const hoy = new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD estable

    const existing = await this.attendanceRepository.findOne({
      where: { usuarioId: user.id, fechaJornada: hoy }
    });

    if (existing) {
      throw new ConflictException(`Ya has registrado tu asistencia para hoy (${hoy}).`);
    }

     return await this.attendanceRepository.save({
      presente: dto.presente,
      motivo: dto.motivo,
      usuarioId: user.id,
      empresaId: user.empresaId,
      fechaJornada: hoy,
    });
  }

  // --- HISTORIAL PERSONAL: ADMIN Y WORKER ---
  /* Método para que un trabajador vea su propio historial de asistencias.
    * El sistema devuelve todas las asistencias registradas por el usuario autenticado, ordenadas por fecha (más reciente primero).     
    *   @Roles(UserRole.ADMIN, UserRole.WORKER) permite que tanto los trabajadores como los administradores puedan revisar su historial personal de asistencias, lo cual es útil para que los administradores también puedan verificar sus propios registros.
    */
async findAllByUser(targetUserId: number, requestingUser: UserPayload) {
    // 🛡️ SEGURIDAD: Un Worker solo puede ver su propio ID. Un Admin puede ver cualquiera de su empresa.
    if (requestingUser.rol === UserRole.WORKER && targetUserId !== requestingUser.id) {
      throw new ForbiddenException('No tienes permiso para ver el historial de otros trabajadores.');
    }

    return await this.attendanceRepository.find({
      where: { 
        usuarioId: targetUserId, 
        empresaId: requestingUser.empresaId 
      },
      order: { fechaJornada: 'DESC' },
    });
  }
  // --- HISTORIAL DE EMPRESA: SOLO ADMIN ---
  /* Método para que un administrador vea todas las asistencias de su empresa.
    * El sistema devuelve todas las asistencias registradas por los trabajadores de la empresa del administrador autenticado, ordenadas por fecha (más reciente primero).
    * Solo los usuarios con rol ADMIN pueden acceder a este método para revisar el historial de asistencias de su empresa, asegurando que los trabajadores no puedan ver los registros de otros empleados.
    * @Roles(UserRole.ADMIN) garantiza que solo los administradores puedan acceder a este método, protegiendo la privacidad de los trabajadores y asegurando que solo el personal autorizado pueda revisar los registros de asistencia de la empresa.
    */
 async findAllByEmpresa(requestingUser: UserPayload) {
    // 🛡️ DOBLE CANDADO: Aunque el Guard falle, el servicio verifica el ROL aquí
    if (requestingUser.rol !== UserRole.ADMIN && requestingUser.rol !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Acceso denegado: Solo el personal administrativo puede ver el historial global.');
    }

    if (!requestingUser.empresaId) {
      throw new BadRequestException('No se puede obtener el historial: Usuario sin empresa vinculada.');
    }

    return await this.attendanceRepository.find({
      where: { empresaId: requestingUser.empresaId },
      relations: ['usuario'],
      order: { fechaJornada: 'DESC', fecha: 'DESC' }
    });
  }
}