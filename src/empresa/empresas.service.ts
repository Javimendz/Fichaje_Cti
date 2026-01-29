// src/empresas/empresas.service.ts
import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Empresa } from './entities/empresa.entity';
import { User } from 'auth/entities/user.entity';
import { UserRole } from 'auth/roles.enum';
import { UserPayload } from 'auth/interfaces/user-payload.interface';
import { CreateEmpresaConAdminDto } from 'auth/dto/CreateEmpresaConAdminDto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { CreateEmpresaDto } from './dto/create-empresa.dto';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    private readonly dataSource: DataSource, // Inyectado para transacciones
  ) {}

  async createWithAdmin(dto: CreateEmpresaConAdminDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Crear la Empresa
      const nuevaEmpresa = queryRunner.manager.create(Empresa, {
        nombre: dto.nombreEmpresa,
      });
      const empresaGuardada = await queryRunner.manager.save(nuevaEmpresa);

      // 2. Crear el Administrador vinculado a esa Empresa
      const nuevoAdmin = queryRunner.manager.create(User, {
        ...dto.admin,
        password: bcrypt.hashSync(dto.admin.password, 10),
        rol: UserRole.ADMIN,
        empresa: empresaGuardada, // Relación directa
        isVerified: true,
        isActive: true,
      });
      await queryRunner.manager.save(nuevoAdmin);

      // Si llegamos aquí sin errores, confirmamos en la DB
      await queryRunner.commitTransaction();


// LOG DE DEPURACIÓN (Borrar antes de subir a producción)
    console.log('--- DEPURACIÓN SETUP ---');
    console.log('Empresa:', dto.nombreEmpresa);
    console.log('Admin Email:', dto.admin.email);
    console.log('Admin Password Recibido:', dto.admin.password); // 👈 Aquí la ves
    console.log('------------------------');

      return {
        message: 'Setup de empresa completado con éxito',
        empresa: { id: empresaGuardada.id, nombre: empresaGuardada.nombre },
        admin: { id: nuevoAdmin.id, email: nuevoAdmin.email }
      };

    } catch (error) {
      // Si algo falla, revertimos (Rollback)
      await queryRunner.rollbackTransaction();
      
      if (error.code === '23505') {
        throw new BadRequestException('El email o DNI ya están registrados en el sistema');
      }
      throw new InternalServerErrorException('No se pudo procesar el alta: ' + error.message);
    } finally {
      // Liberar el queryRunner obligatoriamente
      await queryRunner.release();
    }
  }

  // 2. Crear empresa simple (El que te faltaba)
  async create(dto: CreateEmpresaDto) {
    const empresa = this.empresaRepository.create(dto);
    return await this.empresaRepository.save(empresa);
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
    empresa.isActive = false; // Marcamos como inactiva
    return await this.empresaRepository.save(empresa);
  }

  // Auxiliar para el Seed
  async findByName(nombre: string) {
    return await this.empresaRepository.findOneBy({ nombre });
  }
}