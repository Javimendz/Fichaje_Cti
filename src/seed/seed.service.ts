import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { AllowedPhonesService } from "allowed-phones/allowed-phones.service";
import { UsersService } from "users/users.service";
import { EmpresasService } from '../empresas/empresas.service';
import { CreateAdminDto } from "users/dto/create-admin.dto";
import { CreateWorkerDto } from "users/dto/create-worker.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedsService {
  private readonly logger = new Logger(SeedsService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly empresasService: EmpresasService,
    private readonly allowedPhonesService: AllowedPhonesService,
  ) {}

  async runSeed() {
    
    try {

      
      this.logger.log('Iniciando ejecución de Seed...');

    // -----------------------------------------------------------
    // 1️⃣ Crear Empresa Inicial (Necesaria para los usuarios)
    // -----------------------------------------------------------
    let empresaBase = await this.empresasService.findByName('Empresa Demo');
    if (!empresaBase) {
      empresaBase = await this.empresasService.create({ nombre: 'Empresa Demo' });
      this.logger.log('Empresa Demo creada.');
    }

    // -----------------------------------------------------------
    // 2️⃣ Crear Admin Inicial (SUPERADMIN)
    // -----------------------------------------------------------
    const adminPhone = '+34600111222';
    // Usamos el método que ya tienes en UsersService que filtra por empresa/rol
    const allUsers = await this.usersService.findAllRaw(); // Método auxiliar para obtener todos sin filtros
    const adminExists = allUsers.some(u => u.telefono === adminPhone);
    const hashedPassword = await bcrypt.hash('admin_password', 10);
    if (!adminExists) {
      const adminDto: CreateAdminDto = {
        telefono: adminPhone,
        nombre: 'Admin',
        apellidos: 'Principal',
        dni: '00000000A',
        email: "admin@sistema.com",
        password: hashedPassword, // Si usas password para admins
        empresaId: empresaBase.id
      };

      await this.usersService.createAdmin(adminDto, empresaBase);
      this.logger.log('Admin Inicial creado.');
    }

    // -----------------------------------------------------------
    // 3️⃣ Crear Usuarios (WORKERS) y Allowed Phones
    // -----------------------------------------------------------
   const workers = [
  { 
    telefono: '+34600111223', 
    nombre: 'Usuario1', 
    dni: '11111111A', 
    email: 'worker1@sistema.com' // 👈 Falta esto
  },
  { 
    telefono: '+34600111224', 
    nombre: 'Usuario2', 
    dni: '22222222B', 
    email: 'worker2@sistema.com' // 👈 Falta esto
  },
];

    for (const dto of workers) {
      // 1. Asegurar que el teléfono esté permitido
      const isAllowed = await this.allowedPhonesService.checkPhoneAllowed(dto.telefono);
      if (!isAllowed) {
        await this.allowedPhonesService.addPhone(dto.telefono);
      }

      // 2. Crear el trabajador vinculado a la empresa base
      const exists = allUsers.some(u => u.telefono === dto.telefono);
      if (!exists) {
        const workerDto: CreateWorkerDto = {
          ...dto,
          apellidos: 'Demo',
          empresaId: empresaBase.id
        };
        await this.usersService.createWorker(workerDto, empresaBase);
        this.logger.log(`Trabajador ${dto.nombre} creado.`);
      }
    }

    return { message: 'Seed completado con éxito' };



    } catch (error) {
      this.logger.error('Error en el Seed:', error.detail || error.message);
    
    // Lanzamos una excepción que NestJS sepa formatear para Postman
    throw new InternalServerErrorException({
      message: 'Error al ejecutar el Seed',
      error: error.message,
      detail: error.detail, // Aquí verás qué campo está duplicado
    });
    }


  }
}