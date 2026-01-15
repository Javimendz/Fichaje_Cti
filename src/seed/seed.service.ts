
  import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import * as bcrypt from 'bcrypt';

import { User } from "auth/entities/user.entity";
import { Empresa } from "empresas/entities/empresa.entity";
import { UserRole } from "auth/roles.enum";
import { EmpresasService } from '../empresas/empresas.service';
import { AllowedPhonesService } from "allowed-phones/allowed-phones.service";

@Injectable()
export class SeedsService {
  private readonly logger = new Logger(SeedsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly empresasService: EmpresasService,
    private readonly allowedPhonesService: AllowedPhonesService,
  ) {}

  async runSeed() {
  try {
    this.logger.log('Iniciando ejecución de Seed...');

    // 1️⃣ EMPRESA (Ancla para los usuarios)
    let empresaBase = await this.empresasService.findByName('Empresa Demo');
    if (!empresaBase) {
      empresaBase = await this.empresasService.create({ nombre: 'Empresa Demo' });
    }


const superAdminPhone = '+34600999999';
let superAdmin = await this.userRepository.findOneBy({ telefono: superAdminPhone });

if (!superAdmin) {
  const superAdminData: DeepPartial<User> = {
    telefono: superAdminPhone,
    nombre: 'Super Usuario',
    password: await bcrypt.hash('superpassword', 10),
    rol: UserRole.SUPERADMIN,
    empresa: null as any, 
    isVerified: true,
  };

  // Crea la instancia con los datos y guárdala
  const newSuperAdmin = this.userRepository.create(superAdminData);
  await this.userRepository.save(newSuperAdmin);
  
  this.logger.log('Superadmin creado sin empresa vinculada.');
}

    // 2️⃣ ADMINISTRADOR
    const adminPhone = '+34600111222';
    let admin = await this.userRepository.findOneBy({ telefono: adminPhone });
    if (!admin) {
      admin = this.userRepository.create({
        telefono: adminPhone,
        nombre: 'Admin Demo',
        password: await bcrypt.hash('admin_password', 10),
        rol: UserRole.ADMIN,
        empresa: empresaBase,
        isVerified: true,
      });
      await this.userRepository.save(admin);
    }

   // 3️⃣ TRABAJADOR CON OTP GENERADO
const workerPhone = '+34600111223';
const otpGenerado = Math.floor(100000 + Math.random() * 900000).toString();
const expiracion = new Date(Date.now() + 60 * 60 * 1000);

// Objeto único de la verdad para el OTP
const payloadOTP = {
  codigoOTP: {
    codigo: otpGenerado,
    expiracion: expiracion,
  },
  codigoExpiraEn: expiracion,
};

// 1. Asegurar permiso
if (!(await this.allowedPhonesService.checkPhoneAllowed(workerPhone))) {
  await this.allowedPhonesService.addPhone(workerPhone);
}

// 2. Buscar o Crear
let worker = await this.userRepository.findOneBy({ telefono: workerPhone });

if (!worker) {
  worker = this.userRepository.create({
    telefono: workerPhone,
    nombre: 'Trabajador Dinámico',
    rol: UserRole.WORKER,
    empresa: empresaBase,
    isVerified: false,
    ...payloadOTP // Asignamos aquí
  });
} else {
  // Si ya existe, actualizamos solo lo necesario
  worker.nombre = 'Trabajador Dinámico';
  worker.empresa = empresaBase;
  worker.codigoOTP = payloadOTP.codigoOTP;
  worker.codigoExpiraEn = payloadOTP.codigoExpiraEn;
}

// 3. Guardado único
await this.userRepository.save(worker);
    
    // Imprimimos el código en la consola para que sepas cuál usar en Postman
    this.logger.log('----------------------------------------------------');
    this.logger.log(`SEED COMPLETO`);
    this.logger.log(`Admin Tel: ${adminPhone} / Pass: admin123`);
    this.logger.log(`Worker Tel: ${workerPhone} / OTP GENERADO: ${otpGenerado}`);
    this.logger.log('----------------------------------------------------');

    return { 
      message: 'Seed ejecutado', 
      workerOtp: otpGenerado // Lo devolvemos también en la respuesta de la petición
    };

  } catch (error) {
    this.logger.error('Error en el Seed:', error.message);
    throw new InternalServerErrorException('Fallo al ejecutar el Seed');
  }
}
}