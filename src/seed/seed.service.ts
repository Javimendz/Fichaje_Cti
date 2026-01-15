import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import * as bcrypt from 'bcrypt';

import { User } from "auth/entities/user.entity";
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

      // 2️⃣ SUPERADMIN (Login por EMAIL)
      const superAdminEmail = 'superadmin@cti.com';
      let superAdmin = await this.userRepository.findOneBy({ email: superAdminEmail });

      if (!superAdmin) {
        const superAdminData: DeepPartial<User> = {
          email: superAdminEmail, // Identificador para login
          dni: '00000000S',
          telefono: '+34600999999',
          nombre: 'Super Usuario Global',
          password: await bcrypt.hash('superpassword', 10),
          rol: UserRole.SUPERADMIN,
          empresa: null, 
          isVerified: true,
          isActive: true,
        };
        await this.userRepository.save(this.userRepository.create(superAdminData));
        this.logger.log('Superadmin creado.');
      }

      // 3️⃣ ADMINISTRADOR DE EMPRESA (Login por EMAIL)
      const adminEmail = 'admin@empresa.com';
      let admin = await this.userRepository.findOneBy({ email: adminEmail });

      if (!admin) {
        const adminData: DeepPartial<User> = {
          email: adminEmail, // Identificador para login
          dni: '11111111A',
          telefono: '+34600111222',
          nombre: 'Admin Empresa Demo',
          password: await bcrypt.hash('admin_password', 10),
          rol: UserRole.ADMIN,
          empresa: empresaBase,
          isVerified: true,
          isActive: true,
        };
        await this.userRepository.save(this.userRepository.create(adminData));
        this.logger.log('Administrador de empresa creado.');
      }

      // 4️⃣ TRABAJADOR (Login por DNI)
      const workerDni = '22222222W';
      let worker = await this.userRepository.findOneBy({ dni: workerDni });

      if (!worker) {
        const workerData: DeepPartial<User> = {
          dni: workerDni, // Identificador para login
          email: 'worker@empresa.com',
          telefono: '+34600111223',
          nombre: 'Trabajador Demo',
          password: await bcrypt.hash('worker_password', 10),
          rol: UserRole.WORKER,
          empresa: empresaBase,
          isVerified: true,
          isActive: true,
        };
        await this.userRepository.save(this.userRepository.create(workerData));
        this.logger.log('Trabajador creado.');
      }

      this.logger.log('----------------------------------------------------');
      this.logger.log('SEED EJECUTADO EXITOSAMENTE');
      this.logger.log(`SUPERADMIN -> Email: ${superAdminEmail} | Pass: superpassword (12h)`);
      this.logger.log(`ADMIN      -> Email: ${adminEmail} | Pass: admin_password (12h)`);
      this.logger.log(`WORKER     -> DNI: ${workerDni} | Pass: worker_password (1h)`);
      this.logger.log('----------------------------------------------------');

      return { message: 'Seed completado con éxito' };

    } catch (error) {
      this.logger.error('Error en el Seed:', error.message);
      throw new InternalServerErrorException('Fallo al ejecutar el Seed');
    }
  }
}