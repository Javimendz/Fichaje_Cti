import { User } from 'auth/entities/user.entity';
import { Empresa } from 'empresa/entities/empresa.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { RevisionSolicitud } from './revision-solicitud.entity';



/**
 * Estados posibles de una solicitud.
 * - PENDIENTE: La solicitud está en espera de revisión.
 * - APROBADA: La solicitud ha sido aprobada por un administrador.
 * - RECHAZADA: La solicitud ha sido rechazada por un administrador.
 * @enum SolicitudStatus
 * @see Solicitud para la entidad de solicitudes.
 */

export enum SolicitudStatus {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

/**
 * Tipos posibles de solicitudes.
 * - VACACIONES: Solicitud de días de vacaciones.
 * - ENFERMEDAD: Solicitud por motivos de enfermedad.
 * - PERMISO: Solicitud de permisos especiales.
 * - ASUNTOS_PROPIOS: Solicitud por asuntos personales.
 * @enum TipoSolicitud
 * @see Solicitud para la entidad de solicitudes.
 *  
 */
export enum TipoSolicitud {
  VACACIONES = 'VACACIONES',
  ENFERMEDAD = 'ENFERMEDAD',
  PERMISO = 'PERMISO',
  ASUNTOS_PROPIOS = 'ASUNTOS_PROPIOS',
}
/**
 * Solicitud Entity
 * Representa una solicitud realizada por un usuario dentro del sistema.
 * Contiene información sobre el tipo de solicitud, fechas, estado,
 * y relaciones con el usuario que la realiza y la empresa asociada.
 * Define las columnas de la tabla 'solicitudes' en la base de datos.
 * @entity 'solicitudes' define el nombre de la tabla en la base de datos.
 * @see User para la relación con el usuario que realiza la solicitud.
 * @see Empresa para la relación con la empresa asociada a la solicitud.
 * @see RevisionSolicitud para la relación con la revisión de la solicitud.
 * @metadata createdAt para auditoría de registros.
 * 
 */

@Entity('solicitudes') // Nombre de la tabla en la base de datos
export class Solicitud { // Definición de la entidad Solicitud
 
  // --- IDENTIFICADOR ---
  @PrimaryGeneratedColumn() // ID único generado automáticamente
  id: number; // Identificador único de la solicitud

  // --- DATOS DE LA SOLICITUD ---
  @Column({ type: 'enum', enum: TipoSolicitud }) // Tipo de solicitud
  tipo: TipoSolicitud; // Tipo de solicitud

  @Column({ type: 'date' }) // Fecha de inicio
  fechaInicio: Date; // Fecha de inicio de la solicitud

  @Column({ type: 'date' })// Fecha de fin
  fechaFin: Date; // Fecha de fin de la solicitud

  @Column({ type: 'text', nullable: true }) // Motivo opcional
  motivo: string; // Motivo de la solicitud

  @Column({ type: 'enum', enum: SolicitudStatus, default: SolicitudStatus.PENDIENTE })  // Estado con valor por defecto PENDIENTE
  estado: SolicitudStatus; // Estado de la solicitud

  @CreateDateColumn() // Fecha de creación automática
  fechaSolicitud: Date; // Fecha en que se realizó la solicitud

  // Relaciones
  @ManyToOne(() => User, (user) => user.solicitudes) // Relación con User
  usuario: User; // Usuario que realiza la solicitud

  @Column() // Columna para la clave foránea del usuario
  usuarioId: number; // ID del usuario que realiza la solicitud

  @ManyToOne(() => Empresa) // Relación con Empresa
  @JoinColumn({ name: 'empresa_id' }) // Columna de unión personalizada
  empresa: Empresa; // Empresa asociada a la solicitud

  @Column({ name: 'empresa_id' }) // Columna para la clave foránea de la empresa
  empresaId: number; // ID de la empresa asociada a la solicitud

  @OneToOne(() => RevisionSolicitud, (revision) => revision.solicitud) // Relación uno a uno con RevisionSolicitud
  revision: RevisionSolicitud; // Revisión asociada a la solicitud
  // --- METADATA ---
  @CreateDateColumn() // Fecha de creación automática
  createdAt: Date; // Fecha de creación del registro
}