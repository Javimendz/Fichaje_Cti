// src/empresas/empresas.service.ts
import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Empresa } from './entities/empresa.entity';
import { User } from 'auth/entities/user.entity';
import { UserRole } from 'auth/roles.enum';
import { UserPayload } from 'auth/interfaces/user-payload.interface';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { SetupEmpresaDto } from './dto/setup-empresea.dto';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    private readonly dataSource: DataSource, // Inyectado para transacciones
  ) {}

async createWithAdmin(dto: SetupEmpresaDto) { // Usamos el DTO que tiene todos los campos
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Crear la Empresa con el mapeo completo de campos
    const nuevaEmpresa = queryRunner.manager.create(Empresa, {
  nombre: dto.nombreEmpresa,
  cif: dto.cif,
  direccion: dto.direccion,
  poblacion: dto.poblacion,
  provincia: dto.provincia,
  pais: dto.pais,
  email: dto.email,
  contactoNombre: dto.nombreContacto,
  telefonoContacto: dto.telefonoContacto,
  telefonoEmpresa: dto.telefonoEmpresa,
  
  // AÑADE ESTOS CAMPOS AQUÍ:
  isActive: true               // Por defecto al crearla
});
    
    const empresaGuardada = await queryRunner.manager.save(nuevaEmpresa);

    // 2. Extraer datos del admin y limpiar el objeto
    // Quitamos 'empresaId' si viene en el DTO para evitar conflictos, 
    // ya que usaremos el ID generado arriba.
    const { empresaId, ...adminData } = dto.admin;

    // 3. Crear el Administrador vinculado
    const nuevoAdmin = queryRunner.manager.create(User, {
      ...adminData,
      password: bcrypt.hashSync(dto.admin.password, 10),
      rol: UserRole.ADMIN,
      empresa: empresaGuardada,        // Vinculación de objeto (TypeORM)
      empresaId: empresaGuardada.id,  // Vinculación de FK (Base de datos)
      isVerified: true,
      isActive: true,
    });
    
    await queryRunner.manager.save(nuevoAdmin);

    // 4. Confirmar cambios
    await queryRunner.commitTransaction();

    return {
      message: 'Setup de empresa completado con éxito',
      empresa: { id: empresaGuardada.id, nombre: empresaGuardada.nombre },
      admin: { id: nuevoAdmin.id, email: nuevoAdmin.email }
    };

  } catch (error) {
    await queryRunner.rollbackTransaction();
    
    if (error.code === '23505') {
      throw new BadRequestException('El email o DNI ya están registrados');
    }
    throw new InternalServerErrorException('No se pudo procesar el alta: ' + error.message);
  } finally {
    await queryRunner.release();
  }
}

  // 2. Crear empresa simple (El que te faltaba)
  async create(dto: CreateEmpresaDto) {
    if (dto.cif) {
    const existe = await this.empresaRepository.findOneBy({ cif: dto.cif.toUpperCase() });
    if (existe) throw new BadRequestException('Ya existe una empresa con ese CIF');
  }
  
  const nuevaEmpresa = this.empresaRepository.create(dto);
  return await this.empresaRepository.save(nuevaEmpresa);
  }

  // 3. Listar empresas con filtro de seguridad
  async findAll(user: UserPayload) {
    if (user.rol === UserRole.SUPERADMIN) {
      return await this.empresaRepository.find({ where: { isActive: true }, relations: ['usuarios'] });
    }
    if (!user.empresaId) return [];
    const empresa = await this.empresaRepository.findOne({ 
        where: { id: user.empresaId, isActive: true }, 
        relations: ['usuarios'] 
    });
    return empresa ? [empresa] : [];
  }

  // 4. Buscar una (El que te faltaba)
  async findOne(id: number, user: UserPayload) {
    if (user.rol !== UserRole.SUPERADMIN && user.empresaId !== id) {
      throw new ForbiddenException('No tienes permiso');
    }
    const empresa = await this.empresaRepository.findOne({ where: { id, isActive: true } });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return empresa;
  }

  // 5. Actualizar (El que te faltaba)
  async update(id: number, dto: UpdateEmpresaDto) {
    const empresa = await this.empresaRepository.preload({ id, ...dto });
    if (!empresa) throw new NotFoundException('Empresa no existe');
    return await this.empresaRepository.save(empresa);
  }

  // 6. Eliminar / Soft Delete (El que te faltaba)
  async remove(id: number) {
  const empresa = await this.empresaRepository.findOneBy({ id });
  if (!empresa) throw new NotFoundException('Empresa no encontrada');
  
  // Esto elimina la empresa y, por la cascada, a todos sus usuarios y horarios
  return await this.empresaRepository.remove(empresa);
}
  // Auxiliar para el Seed
  async findByName(nombre: string) {
    return await this.empresaRepository.findOneBy({ nombre });
  }
}