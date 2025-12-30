// src/seeds/seeds.service.ts
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AllowedPhonesService } from '../allowed-phones/allowed-phones.service';
import { CreateAdminDto } from '../users/dto/create-admin.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class SeedsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly allowedPhonesService: AllowedPhonesService,
  ) {}

  async runSeed() {
    // ----------------------
    // 1️⃣ Crear admin inicial
    // ----------------------
    const adminPhone = '+34600111222';
    const existingAdmins = (await this.usersService.findAll()).filter(u => u.rol.includes('admin'));
    const adminExists = existingAdmins.some(u => u.telefono === adminPhone);

    if (!adminExists) {
      const adminDto: CreateAdminDto = {
        telefono: adminPhone,
        nombre: 'Admin Inicial',
        apellidos: 'Perez',
          dni: '00000000A', // dni obligatorio para la entidad

      };
      await this.usersService.createAdmin(adminDto);
    }

    // ----------------------
    // 2️⃣ Crear usuarios normales
    // ----------------------
    const users: CreateUserDto[] = [
      { telefono: '+34600111223', nombre: 'Usuario1', dni: '11111111A' },
      { telefono: '+34600111224', nombre: 'Usuario2', dni: '22222222B' },
    ];

    for (const dto of users) {
      const exists = (await this.usersService.findAll()).some(u => u.telefono === dto.telefono);
      if (!exists) {
        await this.usersService.create(dto); // Esto crea rol: ['user'] por defecto
      }
    }

    // ----------------------
    //Crear allowed phones
    // ----------------------
    const allowedPhones = ['+34600111223', '+34600111224', '+34600111225'];
    for (const telefono of allowedPhones) {
      const exists = await this.allowedPhonesService.checkPhoneAllowed(telefono);
      if (!exists) {
        await this.allowedPhonesService.addPhone(telefono);
      }
    }

    return { message: 'Seed ejecutado correctamente' };
  }
}
