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

      // 1️⃣ EMPRESA BASE
      let empresaBase = await this.empresasService.findByName('Empresa Demo');
      if (!empresaBase) {
        empresaBase = await this.empresasService.create({ nombre: 'Empresa Demo' });
      }

      // 2️⃣ SUPERADMIN (Sin empresa vinculada)
      const superAdminDni = '00000000S';
      let superAdmin = await this.userRepository.findOneBy({ dni: superAdminDni });

      if (!superAdmin) {
        const superAdminData: DeepPartial<User> = {
          dni: superAdminDni,
          telefono: '+34600999999',
          nombre: 'Super Usuario Global',
          password: await bcrypt.hash('superpassword', 10),
          rol: UserRole.SUPERADMIN,
          empresa: null as any, // Importante: null para acceso total
          isVerified: true,
        };
        const newSuperAdmin = this.userRepository.create(superAdminData);
        await this.userRepository.save(newSuperAdmin);
        this.logger.log('Superadmin creado.');
      }

      // 3️⃣ ADMINISTRADOR DE EMPRESA
      const adminDni = '11111111A';
      let admin = await this.userRepository.findOneBy({ dni: adminDni });

      if (!admin) {
        const adminData: DeepPartial<User> = {
          dni: adminDni,
          telefono: '+34600111222',
          nombre: 'Admin Empresa Demo',
          password: await bcrypt.hash('admin_password', 10),
          rol: UserRole.ADMIN,
          empresa: empresaBase,
          isVerified: true,
        };
        const newAdmin = this.userRepository.create(adminData);
        await this.userRepository.save(newAdmin);
        this.logger.log('Administrador de empresa creado.');
      }

      // 4️⃣ TRABAJADOR (Preparado para OTP)
      const workerDni = '22222222W';
      const workerPhone = '+34600111223';
      const otpGenerado = Math.floor(100000 + Math.random() * 900000).toString();
      const expiracion = new Date(Date.now() + 60 * 60 * 1000);

      // Asegurar permiso en lista blanca
      if (!(await this.allowedPhonesService.checkPhoneAllowed(workerPhone))) {
        await this.allowedPhonesService.addPhone(workerPhone);
      }

      let worker = await this.userRepository.findOneBy({ dni: workerDni });

      const payloadOTP = {
        codigoOTP: { codigo: otpGenerado, expiracion: expiracion },
        codigoExpiraEn: expiracion,
      };

      if (!worker) {
        worker = this.userRepository.create({
          dni: workerDni,
          telefono: workerPhone,
          nombre: 'Trabajador Demo',
          rol: UserRole.WORKER,
          empresa: empresaBase,
          isVerified: false,
          ...payloadOTP,
        });
      } else {
        Object.assign(worker, payloadOTP);
      }

      await this.userRepository.save(worker);
      
      this.logger.log('----------------------------------------------------');
      this.logger.log('SEED EJECUTADO EXITOSAMENTE');
      this.logger.log(`SUPERADMIN -> DNI: ${superAdminDni} | Pass: superpassword`);
      this.logger.log(`ADMIN      -> DNI: ${adminDni} | Pass: admin_password`);
      this.logger.log(`WORKER     -> DNI: ${workerDni} | OTP: ${otpGenerado}`);
      this.logger.log('----------------------------------------------------');

      return { message: 'Seed completado con éxito' };

    } catch (error) {
      this.logger.error('Error en el Seed:', error.message);
      throw new InternalServerErrorException('Fallo al ejecutar el Seed');
    }
  }
}