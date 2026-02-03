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
async checkOut(dto: CheckInDto, usuario: User) { // 👈 Añadimos el DTO para capturar GPS al salir
  const jornada = await this.jornadaRepository.findOne({
    where: { usuario: { id: usuario.id }, fin: IsNull() }
  });

  if (!jornada) {
    throw new BadRequestException('No hay jornada activa para cerrar.');
  }

  const ahora = new Date();
  jornada.fin = ahora;
  // Guardamos también la ubicación de salida si se desea
  jornada.latitud = dto.latitud; 
  jornada.longitud = dto.longitud;
  
  // Cálculo de minutos exactos
  jornada.total_minutos = Math.floor((ahora.getTime() - jornada.inicio.getTime()) / 60000);
  jornada.tipo = 'Salida'; // Podrías usar un Enum aquí

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
  // Ajustamos 'hasta' para que incluya todo el día final (23:59:59)
  const fechaFin = new Date(hasta);
  fechaFin.setHours(23, 59, 59, 999);

  return await this.jornadaRepository.find({
    where: { 
      usuario: { id: usuarioId },
      inicio: Between(desde, fechaFin) 
    },
    order: { inicio: 'DESC' },
    relations: ['empresa'] // Útil para el reporte
  });
}


}