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
  @InjectRepository(User) 
  private readonly userRepository: Repository<User>,
  ) {}

async checkIn(dto: CheckInDto, usuario: User) {
  // 1. CARGA FORZADA: Buscamos al usuario real para asegurar que tenemos su empresa
  const usuarioReal = await this.userRepository.findOne({
    where: { id: usuario.id },
    relations: ['empresa'] 
  });

  if (!usuarioReal) throw new BadRequestException('Usuario no encontrado');
  
  // Verificación de seguridad: si no tiene empresa en la DB, no puede fichar
  if (!usuarioReal.empresa) {
    throw new BadRequestException('El usuario no tiene una empresa asignada en la base de datos.');
  }

  // 2. Verificación de jornada abierta (evita duplicados)
  const jornadaAbierta = await this.jornadaRepository.findOne({
    where: { usuario: { id: usuario.id }, fin: IsNull() }
  });

  if (jornadaAbierta) {
    throw new BadRequestException('Ya tienes una jornada activa.');
  }

  // 3. Creación: Asignamos manualmente latitud y longitud para asegurar el registro
  const nuevaJornada = this.jornadaRepository.create({
    inicio: new Date(),
    tipo: 'Entrada',
    latitud: dto.latitud,    // Mapeo explícito desde el DTO
    longitud: dto.longitud,  // Mapeo explícito desde el DTO
    usuario: usuarioReal,    // Usamos el objeto completo para no borrar el teléfono
    empresa: usuarioReal.empresa 
  });

  const guardada = await this.jornadaRepository.save(nuevaJornada);

  // 4. Retorno final con todas las relaciones cargadas
  return await this.jornadaRepository.findOne({
    where: { id: guardada.id },
    relations: ['usuario', 'empresa']
  });
}
// FINALIZAR JORNADA (Check-out)
// Cambiamos 'usuarioId: string' por 'usuario: User'
async checkOut(usuario: User) {
  const jornada = await this.jornadaRepository.findOne({
    where: { usuario: { id: usuario.id }, fin: IsNull() }
  });

  if (!jornada) {
    throw new BadRequestException('No hay jornada activa para cerrar.');
  }

  jornada.fin = new Date();
  jornada.total_minutos = Math.floor((jornada.fin.getTime() - jornada.inicio.getTime()) / 60000);
  jornada.tipo = 'Salida';
  return await this.jornadaRepository.save(jornada);
}


async findActiveJornada(usuarioId: number): Promise<Jornada | null> {
  return await this.jornadaRepository.findOne({
    where: { usuario: { id: usuarioId }, fin: IsNull() }
  });
}

// 4. VER MI HISTORIAL (Usado por /historial)
async getHistorial(usuarioId: number) {
  return await this.jornadaRepository.find({
    where: { usuario: { id: usuarioId } },
    order: { inicio: 'DESC' }
  });
}

// 5. HISTORIAL POR RANGO (Usado por /rango)
async findAllByRange(usuarioId: number, desde: Date, hasta: Date) {
  return await this.jornadaRepository.find({
    where: { 
      usuario: { id: usuarioId },
      inicio: Between(desde, hasta) 
    },
    order: { inicio: 'DESC' }
  });
}


}