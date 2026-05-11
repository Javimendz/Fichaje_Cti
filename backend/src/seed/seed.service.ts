// src/seeds/seeds.service.ts

import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DeepPartial, Like } from "typeorm";
import * as bcrypt from 'bcrypt';
import { ConfigService } from "@nestjs/config";

import { User } from "../auth/entities/user.entity";
import { UserRole } from "../auth/roles.enum";
import { Company } from "../company/entities/company.entity";
import { Worker } from "../worker/entities/worker.entity"; // 👈 FALTABA ESTA IMPORTACIÓN

@Injectable()
export class SeedsService {
  private readonly logger = new Logger(SeedsService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Company) private readonly companyRepository: Repository<Company>,
    @InjectRepository(Worker) private readonly workerRepository: Repository<Worker>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Método principal que orquestra el Seed completo.
   * Requiere la secretKey para ejecutarse.
   */
  async runSeed(secretKey: string) {
    this.validateSecretKey(secretKey);
    
    try {



      await this.createSuperAdmin();
      return { ok: true, message: 'Sistema inicializado (SuperAdmin!!!!).' };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error en runSeed');
    }
  }

  /**
   * Crea el SuperAdmin si no existe
   */
  private async createSuperAdmin() {
    const superAdminEmail = 'superadmin@cti.com';
    let superAdmin = await this.userRepository.findOneBy({ email: superAdminEmail });

    if (!superAdmin) {
      const superAdminData: DeepPartial<User> = { 
        email: superAdminEmail,
        dni: '00000000S',
        telefono: '+34600999999',
        nombre: 'Super Usuario Global',
        password: await bcrypt.hash('superpassword123M', 10),
        rol: UserRole.SUPERADMIN,
        empresa: null,
        isVerified: true,
        isActive: true,
      };
      
      const nuevoUser = this.userRepository.create(superAdminData);
      await this.userRepository.save(nuevoUser);
      this.logger.log('Superadmin "Super Usuario Global" creado con éxito.');
    }
  }

  /**
   * Genera una carga masiva de trabajadores sincronizados (Users + Workers)
   */
  public async createBulkWorkers(empresaId: number, cantidad: number = 100) {
    this.logger.log(`Generando ${cantidad} trabajadores sincronizados...`);

    try {
      // Limpieza para evitar duplicados
      const usersToDelete = await this.userRepository.find({
  where: { email: Like('%@cti-demo.com') },
  select: ['id']
});

if (usersToDelete.length > 0) {
  const ids = usersToDelete.map(u => u.id);
  // 1. Borramos los perfiles de Worker primero
  await this.workerRepository.delete(ids);
  // 2. Borramos los Usuarios (Auth) después
  await this.userRepository.delete(ids);
}

      const passwordHashed = await bcrypt.hash('worker123', 10);
      const batchId = Date.now().toString().slice(-6);

      for (let i = 1; i <= cantidad; i++) {
        const uniqueNum = `${batchId}${i.toString().padStart(3, '0')}`;
        
        // --- PASO A: Crear Usuario (Tabla users) ---
        const newUser = await this.userRepository.save(this.userRepository.create({
          email: `u${uniqueNum}@cti-demo.com`,
          dni: uniqueNum,
          nombre: `Worker`,
          apellidos: `Demo ${i}`,
          password: passwordHashed,
          telefono: `+346${uniqueNum.slice(-8)}`,
          rol: UserRole.WORKER,
          empresaId: empresaId,
          isActive: true,
          isVerified: true,
        }));

        // Datos para la tabla workers
        const workerData = {
          id: newUser.id,
          nombre: newUser.nombre,
          apellidos: newUser.apellidos,
          email: newUser.email,
          dni: newUser.dni,
          password: passwordHashed,
          telefono: newUser.telefono,
          empresaId: empresaId,
          rol: UserRole.WORKER,
          isActive: true,
          isVerified: true,
          poblacion: 'Madrid',
          provincia: 'Madrid',
          pais: 'España'
        };

        // --- PASO B: Crear Perfil (Tabla workers) con el MISMO ID ---
await this.workerRepository.save(workerData as any);      } // 👈 FALTABA ESTA LLAVE PARA CERRAR EL BUCLE FOR

      // El return debe ir FUERA del bucle
      return { ok: true, message: `${cantidad} trabajadores creados en Users y Workers.` };
      
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error al crear trabajadores masivos');
    }
  }

  /**
   * Valida la clave de seguridad contra las variables de entorno
   */
  private validateSecretKey(key: string) {
    const masterKey = this.configService.get('SEED_SECRET_KEY');
    if (!key || key !== masterKey) {
      throw new UnauthorizedException('Clave incorrecta');
    }
  }

  /**
   * Método extra para limpieza manual desde el controlador
   */
  public async clearDemoUsers() {
    this.logger.warn('Ejecutando purga de usuarios de prueba...');
    
    try {
      const resultado = await this.userRepository.delete({
        email: Like('%@cti-demo.com'),
        rol: UserRole.WORKER,
      });
      return { ok: true, eliminados: resultado.affected };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error al limpiar usuarios demo');
    }
  }
}