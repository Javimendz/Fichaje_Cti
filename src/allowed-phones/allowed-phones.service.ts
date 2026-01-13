import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAllowedPhoneDto } from './dto/create-allowed-phone.dto';
import { UpdateAllowedPhoneDto } from './dto/update-allowed-phone.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AllowedPhone } from './entities/allowed-phone.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AllowedPhonesService {
  constructor(
    @InjectRepository(AllowedPhone)
    private readonly allowedPhoneRepo: Repository<AllowedPhone>,
  ) {}

  findAll() {
    return this.allowedPhoneRepo.find();
  }

async create(createPhoneDto: CreateAllowedPhoneDto, adminId: string, empresaId: string) {
  const { telefono } = createPhoneDto;

  // Forzamos el objeto a DeepPartial para que TypeORM no se confunda con los overloads
  const newPhone = this.allowedPhoneRepo.create({
    telefono: telefono,
    empresaId: empresaId,
    addedBy: adminId,
    active: true,
    used: false,
    source: 'ADMIN_PANEL',
  } as any); // El 'as any' o 'as DeepPartial<AllowedPhone>' rompe el bucle de error de TS

  return await this.allowedPhoneRepo.save(newPhone);
}
  async remove(id: string) {
    const result = await this.allowedPhoneRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Número no encontrado');
    return { message: 'Número eliminado' };
  }

 async checkPhoneAllowed(telefono: string) {
  // .trim() elimina espacios accidentales
  const cleanPhone = telefono.trim(); 
  
  const allowed = await this.allowedPhoneRepo.findOneBy({ 
    telefono: cleanPhone, 
    active: true, 
    used: false 
  });
  
  return allowed;
}

  async markUsed(telefono: string) {
    const allowed = await this.allowedPhoneRepo.findOneBy({ telefono });
    if (!allowed) return;
    allowed.used = true;
    await this.allowedPhoneRepo.save(allowed);
  }

  async deactivate(id: string) {
  const phone = await this.allowedPhoneRepo.findOneBy({ id });
  if (!phone) throw new NotFoundException('Número no encontrado');
  phone.active = false;
  return this.allowedPhoneRepo.save(phone);
}

async findActive() {
  return this.allowedPhoneRepo.findBy({ active: true });
}

async findExpired() {
  const now = new Date();
  return this.allowedPhoneRepo
    .createQueryBuilder('phone')
    .where('phone.expiresAt <= :now', { now })
    .getMany();
}

async addPhone(telefono: string) {
  const phone = this.allowedPhoneRepo.create({ telefono, active: true, used: false });
  return this.allowedPhoneRepo.save(phone);
}
}