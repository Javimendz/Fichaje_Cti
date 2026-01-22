import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import * as bcrypt from 'bcrypt';

import { User } from "auth/entities/user.entity";
import { UserRole } from "auth/roles.enum";
import { EmpresasService } from '../empresas/empresas.service';
import { AllowedPhonesService } from "allowed-phones/allowed-phones.service";

/**
 * SeedsService
 * Servicio encargado de la inicialización de datos básicos en el sistema.
 * Proporciona un método para ejecutar el seed que crea usuarios esenciales
 * como el SuperAdmin, necesario para arrancar la aplicación.
 * Métodos principales:
 * - runSeed: Crea el usuario SuperAdmin si no existe.
 * @see User para la entidad de usuarios.
 * @see EmpresasService para la gestión de empresas.
 * @see AllowedPhonesService para la gestión de teléfonos permitidos.
 * @see https://docs.nestjs.com/providers
 * //
 *
 */

@Injectable()
export class SeedsService {
  private readonly logger = new Logger(SeedsService.name);

  constructor(
    @InjectRepository(User) // Inyección del repositorio de User
    private readonly userRepository: Repository<User>, // Repositorio para operaciones CRUD en User
   
  ) {}


  /*
  async runSeed() {
    try {
      this.logger.log('Iniciando ejecución de Seed...');

      let empresaBase = await this.empresasService.findByName('Empresa Demo');
      if (!empresaBase) {
        empresaBase = await this.empresasService.create({ nombre: 'Empresa Demo' });
      }

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
  }*/

/**
 *  runSeed
 *  Método para ejecutar la inicialización de datos básicos en el sistema.
 * Crea un usuario SuperAdmin si no existe, necesario para arrancar la aplicación.  
 *   
 * @returns Mensaje indicando el resultado de la operación.
 * @throws InternalServerErrorException si ocurre un error durante la ejecución del seed.
 * @see User para la entidad de usuarios.  
 */

async runSeed() {
  try {
    this.logger.log('Iniciando ejecución de Seed...');

    // 1. SUPERADMIN (Único usuario necesario para arrancar el sistema)
    const superAdminEmail = 'superadmin@cti.com'; // Email de login
    let superAdmin = await this.userRepository.findOneBy({ email: superAdminEmail }); // Buscar por email

    if (!superAdmin) { // Si no existe, lo creamos
      const superAdminData = { // Datos del SuperAdmin
        email: superAdminEmail, // Identificador para login
        dni: '00000000S', // DNI ficticio
        telefono: '+34600999999', // Teléfono ficticio
        nombre: 'Super Usuario Global', // Nombre del SuperAdmin
        password: await bcrypt.hash('superpassword', 10), // Contraseña hasheada
        rol: UserRole.SUPERADMIN, // Rol de SuperAdmin
        empresa: null, // El SuperAdmin no pertenece a ninguna empresa específica
        isVerified: true, // Cuenta verificada
        isActive: true, // Cuenta activa
      };
      await this.userRepository.save(this.userRepository.create(superAdminData)); // Guardar en la base de datos
      this.logger.log('Superadmin creado con éxito.'); // Log de creación
    }

    return { message: 'Sistema inicializado. Use el SuperAdmin para crear empresas.' }; // Mensaje de éxito
  } catch (error) {
    throw new InternalServerErrorException('Fallo al ejecutar el Seed'); // Error genérico
  }
}



} 