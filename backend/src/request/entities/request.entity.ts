import { User } from '../../auth/entities/user.entity';
import { Company } from '../../company/entities/company.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn, JoinColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { RevisionRequest } from './revision-request.entity';
import { RequestStatus } from '../dto/revisar-request.dto';



/**
 * Estados posibles de una solicitud.
 * - PENDIENTE: La solicitud está en espera de revisión.
 * - APROBADA: La solicitud ha sido aprobada por un administrador.
 * - RECHAZADA: La solicitud ha sido rechazada por un administrador.
 * @enum SolicitudStatus
 * @see Request para la entidad de solicitudes.
 */


/**
 * Tipos posibles de solicitudes.
 * - VACACIONES: Solicitud de días de vacaciones.
 * - ENFERMEDAD: Solicitud por motivos de enfermedad.
 * - PERMISO: Solicitud de permisos especiales.
 * - ASUNTOS_PROPIOS: Solicitud por asuntos personales.
 * @enum TipoSolicitud
 * @see Request para la entidad de solicitudes.
 *  
 */
export enum TipoSolicitud {
  VACACIONES = 'VACACIONES',
  ENFERMEDAD = 'ENFERMEDAD',
  PERMISO = 'PERMISO',
  ASUNTOS_PROPIOS = 'ASUNTOS_PROPIOS',
  OTROS = 'OTROS'
}
/**
 * Solicitud Entity
 * Representa una solicitud realizada por un usuario dentro del sistema.
 * Contiene información sobre el tipo de solicitud, fechas, estado,
 * y relaciones con el usuario que la realiza y la empresa asociada.
 * Define las columnas de la tabla 'solicitudes' en la base de datos.
 * @entity 'solicitudes' define el nombre de la tabla en la base de datos.
 * @see User para la relación con el usuario que realiza la solicitud.
 * @see Company para la relación con la empresa asociada a la solicitud.
 * @see RevisionRequest para la relación con la revisión de la solicitud.
 * @metadata createdAt para auditoría de registros.
 * 
 */

@Entity('solicitudes') // Nombre de la tabla en la base de datos
export class Request { // Definición de la entidad Solicitud

  // --- IDENTIFICADOR ---
  @PrimaryGeneratedColumn() // ID único generado automáticamente
  id: number; // Identificador único de la solicitud

  // --- DATOS DE LA SOLICITUD ---
  @Column({ type: 'enum', enum: TipoSolicitud }) // Tipo de solicitud
  tipo: TipoSolicitud; // Tipo de solicitud

  @Column({ type: 'text', nullable: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  apellidos: string;

  @Column({ type: 'date' }) // Fecha de inicio
  fechaInicio: Date; // Fecha de inicio de la solicitud

  @Column({ type: 'date' })// Fecha de fin
  fechaFin: Date; // Fecha de fin de la solicitud

  @Column({ type: 'text', nullable: true }) // Motivo opcional
  motivo: string; // Motivo de la solicitud

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDIENTE })  // Estado con valor por defecto PENDIENTE
  estado: RequestStatus; // Estado de la solicitud

  @CreateDateColumn() // Fecha de creación automática
  fechaSolicitud: Date; // Fecha en que se realizó la solicitud

  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt: Date;
  // Relaciones
  @ManyToOne(() => User, (user) => user.solicitudes, {
    onDelete: 'CASCADE'
  }) usuario: User; // Usuario que realiza la solicitud

  @Column() // Columna para la clave foránea del usuario
  usuarioId: number; // ID del usuario que realiza la solicitud

@ManyToOne(() => Company, (company) => company.solicitudes, { 
    onDelete: 'CASCADE' 
  })
  @JoinColumn({ name: 'empresa_id' }) // Esto crea la columna física en la DB
  empresa: Company;// Empresa asociada a la solicitud

  @Column({ name: 'empresa_id' }) // Columna para la clave foránea de la empresa
  empresaId: number; // ID de la empresa asociada a la solicitud

  @OneToOne(() => RevisionRequest, (revision) => revision.solicitud) // Relación uno a uno con RevisionSolicitud
  revision: RevisionRequest; // Revisión asociada a la solicitud
  // --- METADATA ---
  @CreateDateColumn() // Fecha de creación automática
  createdAt: Date; // Fecha de creación del registro
}