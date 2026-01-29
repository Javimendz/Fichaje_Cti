import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Solicitud } from './solicitud.entity';
import { User } from 'auth/entities/user.entity';

/**
 * RevisionSolicitud Entity
 * Representa la revisión de una solicitud realizada por un administrador.
 * Contiene información sobre quién revisó la solicitud, el comentario del administrador
 * y la fecha de la decisión.
 * Define las columnas de la tabla 'revisiones_solicitudes' en la base de datos.
 * @entity 'revisiones_solicitudes' define el nombre de la tabla en la base de datos.
 * @see Solicitud para la relación con la solicitud revisada.
 * @see User para la relación con el administrador que revisó la solicitud.
 * @metadata fechaDecision para auditoría de registros.
 * 
 */
@Entity('revisiones_solicitudes')
export class RevisionSolicitud { // Definición de la entidad RevisionSolicitud
  // --- IDENTIFICADOR ---
  @PrimaryGeneratedColumn() // ID único generado automáticamente
  id: number; // Identificador único de la revisión

  // --- DATOS DE LA REVISIÓN ---

  // Relación 1:1 con la Solicitud
  @OneToOne(() => Solicitud, (solicitud) => solicitud.revision, { onDelete: 'CASCADE' }) // Si se elimina la solicitud, se elimina la revisión
  @JoinColumn({ name: 'solicitud_id' }) // Columna de unión personalizada
  solicitud: Solicitud; // Solicitud asociada a esta revisión

  @Column({ name: 'solicitud_id' }) // Columna para la clave foránea de la solicitud
  solicitudId: number; // ID de la solicitud asociada

  // Quién tomó la decisión
  @ManyToOne(() => User) // Relación con User (administrador que revisa)
@JoinColumn({ name: 'revisado_por_id' }) // Columna de unión personalizada
admin: User; // Administrador que revisó la solicitud

  @Column({ name: 'revisado_por_id' }) // Columna para la clave foránea del administrador
adminId: number; // ID del administrador que revisó la solicitud

  @Column({ type: 'text', nullable: true }) // Comentario opcional del administrador
  comentarioAdmin: string; // Comentarios del administrador sobre la revisión

  @CreateDateColumn() // Fecha de la decisión automática
  fechaDecision: Date; // Fecha en que se tomó la decisión sobre la solicitud

  
}