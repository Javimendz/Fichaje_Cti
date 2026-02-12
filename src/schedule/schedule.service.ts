import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './entities/schedules.entity';
import { CreateHorarioDto } from './dto/create-schedule.dto';
//  Usamos UserPayload, no la entidad User completa
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; 
import { FranjaHoraria } from 'timeSlot/entities/franja-horaria.entity';
import { DistribucionDia } from './entities/distribucion-dia.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Horario)
    private readonly horarioRepository: Repository<Horario>,
    @InjectRepository(DistribucionDia)
    private readonly distribucionRepository: Repository<DistribucionDia>,
    @InjectRepository(FranjaHoraria)
    private readonly franjaRepository: Repository<FranjaHoraria>,
  ) {}

  /**
   * Crea un nuevo horario asociado a la empresa del usuario.
   * Ahora acepta UserPayload para coincidir con el Controlador.
   */
  async create(dto: CreateHorarioDto, user: UserPayload) { // Corregido: user: UserPayload
    // 1. Validación de seguridad (Defensiva, aunque el controller ya lo valida)
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa asignada');
    }

    // 2. Validación de fechas
    const inicio = new Date(dto.fechaInicio);
    const fin = new Date(dto.fechaFin);
    if (inicio >= fin) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    // 3. Creación del objeto
    // TypeORM mapea automáticamente el ID de la empresa
    const nuevoHorario = this.horarioRepository.create({
      ...dto,
      empresa: { id: user.empresaId }, // 👈 Vinculación por ID
    });

    try {
      // Guarda en cascada (Horario -> Distribuciones -> Franjas) si la entidad está configurada así
      return await this.horarioRepository.save(nuevoHorario);
    } catch (error) {
      // Manejo de errores (ej. duplicados)
      throw new BadRequestException('Error al guardar el horario: ' + error.message);
    }
  }

  /**
   * Lista horarios por empresa.
   * El controlador envía directamente el ID (number).
   */
  async findAllByEmpresa(empresaId: number) {
    return await this.horarioRepository.find({
      where: { 
        empresa: { id: empresaId }, // 👈 Sintaxis segura de TypeORM para relaciones
        isActive: true 
      },
      relations: ['distribuciones', 'distribuciones.franjas'],
      order: {
        createdAt: 'DESC',
        distribuciones: {
          id: 'ASC',
          franjas: { inicio: 'ASC' }
        }
      }
    });
  }

  /**
   * Busca un horario específico asegurando que pertenezca a la empresa.
   */
  async findOne(id: number, empresaId: number) {
    const horario = await this.horarioRepository.findOne({
      where: { 
        id, 
        empresa: { id: empresaId } // 👈 Filtro de seguridad vital
      },
      relations: ['distribuciones', 'distribuciones.franjas']
    });

    if (!horario) throw new NotFoundException(`Horario no encontrado o no tienes acceso`);
    return horario;
  }

  /**
   * Elimina un horario (físicamente) tras verificar propiedad.
   */
  async remove(id: number, empresaId: number) {
    // 1. Reutilizamos findOne para verificar existencia y propiedad
    // Esto ahorra código y asegura que solo borramos lo que es de la empresa
    await this.findOne(id, empresaId);

    // 2. Ejecutamos el borrado
    const result = await this.horarioRepository.delete(id);

    if (result.affected === 0) {
        throw new NotFoundException('No se pudo eliminar el horario');
    }

    return { message: 'Horario eliminado correctamente' };
  }
}