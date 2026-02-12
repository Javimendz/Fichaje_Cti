// src/empresas/empresas.service.ts
import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Company } from './entities/company.entity';
import { User } from 'auth/entities/user.entity';
import { UserRole } from 'auth/roles.enum';
import { UserPayload } from 'auth/interfaces/user-payload.interface';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { SetupCompanyDto } from './dto/setup-company.dto';

@Injectable()
export class CompanyService {
  logger: any;
  constructor(
    @InjectRepository(Company)
    private readonly empresaRepository: Repository<Company>,
    private readonly dataSource: DataSource, // Inyectado para transacciones
  ) {}

async createWithAdmin(dto: SetupCompanyDto) { // Usamos el DTO que tiene todos los campos
  // 1. Validación previa (Fuera de la transacción para ahorrar recursos)
  const cifExiste = await this.empresaRepository.findOneBy({ cif: dto.cif });
  if (cifExiste) throw new BadRequestException('El CIF de la empresa ya está registrado');

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Crear la Empresa con el mapeo completo de campos
    const nuevaEmpresa = queryRunner.manager.create(Company, {
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
  empresa: { 
    id: empresaGuardada.id, 
    nombre: empresaGuardada.nombre 
  },
  admin: { 
    id: nuevoAdmin.id, 
    email: nuevoAdmin.email,
    rol: nuevoAdmin.rol 
  }
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
/*
  // 2. Crear empresa simple (El que te faltaba)
  async create(dto: CreateEmpresaDto) {
    if (dto.cif) {
    const existe = await this.empresaRepository.findOneBy({ cif: dto.cif.toUpperCase() });
    if (existe) throw new BadRequestException('Ya existe una empresa con ese CIF');
  }
  
  const nuevaEmpresa = this.empresaRepository.create(dto);
  return await this.empresaRepository.save(nuevaEmpresa);
  }
*/
  // 3. Listar empresas con filtro de seguridad
 

async findAll(user: UserPayload) {
  // 1. Iniciamos el QueryBuilder con un alias claro
  const query = this.empresaRepository.createQueryBuilder('empresa')
    // Traemos solo el administrador activo para evitar cargar datos innecesarios
    .leftJoinAndSelect(
      'empresa.usuarios', 
      'admin', 
      'admin.rol = :rol AND admin.isActive = :isActive', 
      { rol: UserRole.ADMIN, isActive: true }
    );

  // 2. Filtro de Seguridad por Rol
  if (user.rol !== UserRole.SUPERADMIN) {
    // Si no es SUPERADMIN, solo puede ver SU empresa
    if (!user.empresaId) {
      this.logger.warn(`Usuario ${user.email} intentó listar empresas sin tener empresaId asignado.`);
      return []; 
    }

    query.where('empresa.id = :id', { id: user.empresaId })
         .andWhere('empresa.isActive = :active', { active: true });
  }

  // 3. Ejecución de la consulta
  try {
    const empresas = await query.getMany();
    
    // 4. Mapeo de respuesta profesional (formateo centralizado)
    return empresas.map(empresa => this.formatResponse(empresa));
  } catch (error) {
    this.logger.error(`Error al listar empresas: ${error.message}`);
    throw new InternalServerErrorException('Error al recuperar la lista de empresas');
  }
}

async findOne(id: number, user: UserPayload) {
    if (user.rol !== UserRole.SUPERADMIN && user.empresaId !== id) {
      throw new ForbiddenException('No tienes permiso');
    }

    const empresa = await this.empresaRepository.createQueryBuilder('empresa')
      .leftJoinAndSelect('empresa.usuarios', 'usuario', 'usuario.rol = :rol', { rol: UserRole.ADMIN })
      .where('empresa.id = :id', { id })
      .getOne();

    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return this.formatResponse(empresa);
  }

  // 5. Actualizar (El que te faltaba)
 async update(id: number, dto: UpdateCompanyDto) {
  const { admin, ...empresaDatos } = dto as any;

  // --- 1. VALIDACIÓN DE DUPLICADOS DE EMPRESA ---
  
  if (empresaDatos.nombre) {
    const nombreNormalizado = empresaDatos.nombre.toUpperCase().trim();
    const empresaExistente = await this.empresaRepository.findOne({
      where: { nombre: nombreNormalizado }
    });
    // Si existe con ese nombre pero tiene un ID distinto al que editamos, es duplicado
    if (empresaExistente && empresaExistente.id !== id) {
      throw new BadRequestException(`Ya existe otra empresa registrada con el nombre: ${empresaDatos.nombre}`);
    }
    empresaDatos.nombre = nombreNormalizado;
  }

  if (empresaDatos.cif) {
    const cifNormalizado = empresaDatos.cif.toUpperCase().trim();
    const cifExistente = await this.empresaRepository.findOne({
      where: { cif: cifNormalizado }
    });
    if (cifExistente && cifExistente.id !== id) {
      throw new BadRequestException(`El CIF ${empresaDatos.cif} ya pertenece a otra empresa.`);
    }
    empresaDatos.cif = cifNormalizado;
  }

  // --- 2. PRELOAD DE LA EMPRESA ---
  const empresa = await this.empresaRepository.preload({ id, ...empresaDatos });
  if (!empresa) throw new NotFoundException(`Empresa con ID ${id} no existe`);

  // --- 3. ACTUALIZACIÓN DEL ADMINISTRADOR (USER) ---
  if (admin) {
    const adminUpdateData = { ...admin };

    // Validar si el email ya existe en OTRO usuario
    if (adminUpdateData.email) {
      const emailLimpio = adminUpdateData.email.toLowerCase().trim();
      const emailExists = await this.dataSource.getRepository(User).findOne({
        where: { email: emailLimpio }
      });

      // Si el email existe y el dueño no es el admin de esta empresa
      if (emailExists && emailExists.empresaId !== id) {
        throw new BadRequestException(`El email ${adminUpdateData.email} ya está registrado por otro usuario.`);
      }
      adminUpdateData.email = emailLimpio;
    }

    // Encriptar password si viene
    if (adminUpdateData.password) {
      adminUpdateData.password = await bcrypt.hash(adminUpdateData.password, 10);
    }

    try {
      // Actualizamos al usuario que sea ADMIN y pertenezca a esta empresa
      await this.dataSource
        .createQueryBuilder()
        .update(User)
        .set(adminUpdateData)
        .where('empresaId = :id', { id })
        .andWhere('rol = :rol', { rol: UserRole.ADMIN })
        .execute();
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('El email o teléfono del administrador ya están en uso por otro usuario.');
      }
      throw new InternalServerErrorException('Error al actualizar los datos del administrador');
    }
  }

  // --- 4. GUARDADO FINAL Y RETORNO ---
  try {
    await this.empresaRepository.save(empresa);
    // Devolvemos la empresa actualizada usando el findOne existente
    return this.findOne(id, { rol: UserRole.SUPERADMIN } as any);
  } catch (error) {
    if (error.code === '23505') {
      throw new BadRequestException('Error de duplicidad: el nombre o CIF de la empresa ya existen.');
    }
    throw new InternalServerErrorException('Error inesperado al guardar los cambios de la empresa');
  }
}

  private formatResponse(empresa: Company) {
    const { usuarios, ...resto } = empresa;
    return {
      ...resto,
      admin: (usuarios && usuarios.length > 0) ? usuarios[0] : null
    };
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