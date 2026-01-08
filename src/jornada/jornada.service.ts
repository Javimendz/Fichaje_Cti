import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between } from 'typeorm';
import { Jornada } from './entities/jornada.entity';
import { CheckInDto } from './dto/check-in.dto';
import { User } from 'auth/entities/user.entity';

@Injectable()
export class JornadasService {
  constructor(
    @InjectRepository(Jornada)
    private readonly jornadaRepository: Repository<Jornada>,
  ) {}

  // INICIAR JORNADA (Check-in)
  async checkIn(dto: CheckInDto, usuario: User) {
    // Verificar si ya tiene una jornada abierta
    const jornadaAbierta = await this.jornadaRepository.findOne({
      where: { usuario: { id: usuario.id }, fin: IsNull() }
    });

    if (jornadaAbierta) {
      throw new BadRequestException('Ya tienes una jornada activa.');
    }

    const nuevaJornada = this.jornadaRepository.create({
      inicio: new Date(),
      tipo: 'Entrada',
      latitud: dto.latitud,
      longitud: dto.longitud,
      usuario: usuario
    });

    return await this.jornadaRepository.save(nuevaJornada);
  }

  // FINALIZAR JORNADA (Check-out)
  async checkOut(usuario: User) {
    const jornada = await this.jornadaRepository.findOne({
      where: { usuario: { id: usuario.id }, fin: IsNull() }
    });

    if (!jornada) {
      throw new BadRequestException('No tienes ninguna jornada activa para cerrar.');
    }

    jornada.fin = new Date();
    jornada.tipo = 'Salida';

    // Cálculo de total_minutos
    const diffMs = jornada.fin.getTime() - jornada.inicio.getTime();
    jornada.total_minutos = Math.floor(diffMs / (1000 * 60));

    return await this.jornadaRepository.save(jornada);
  }

  async getHistorial(usuarioId: string) {
    return await this.jornadaRepository.find({
      where: { usuario: { id: usuarioId } },
      order: { inicio: 'DESC' }
    });
  }


  // 3. BUSCAR JORNADA ACTUAL
  async findActiveJornada(usuarioId: string): Promise<Jornada | null> {
    return await this.jornadaRepository.findOne({
      where: { usuario: { id: usuarioId }, fin: IsNull() }
    });
  }

  // 4. HISTORIAL PARA ADMINS O USUARIO
  async findAllByRange(usuarioId: string, desde: Date, hasta: Date) {
    return await this.jornadaRepository.find({
      where: { 
        usuario: { id: usuarioId },
        inicio: Between(desde, hasta) 
      },
      order: { inicio: 'DESC' }
    });
  }
}