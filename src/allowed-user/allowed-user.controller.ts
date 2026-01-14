import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AllowedUserService } from './allowed-user.service';
import { CreateAllowedUserDto } from './dto/create-allowed-user.dto';
import { UpdateAllowedUserDto } from './dto/update-allowed-user.dto';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { User } from 'auth/entities/user.entity';
import { GetUser } from 'auth/decorators/get-user.decorator';


@Controller('allowed-user')
@UseGuards(JwtAuthGuard) // 👈 Solo administradores autenticados pueden usar este recurso
export class AllowedUserController {
  constructor(private readonly allowedUserService: AllowedUserService) {}

  @Post()
  create(
    @Body() createAllowedUserDto: CreateAllowedUserDto,
    @GetUser() admin: User // 👈 Extraemos el Admin logueado para obtener su empresaId
  ) {
    return this.allowedUserService.create(createAllowedUserDto, admin);
  }

  @Get()
  findAll(@GetUser() admin: User) {

  if (!admin.empresaId) {
      throw new UnauthorizedException('El administrador no tiene una empresa asignada');
    }

    // Solo devolvemos los trabajadores de la empresa del administrador
    return this.allowedUserService.findAllByEmpresa(admin.empresaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.allowedUserService.findOne(id); // Eliminamos el '+' porque usas UUID (string)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAllowedUserDto: UpdateAllowedUserDto) {
    return this.allowedUserService.update(id, updateAllowedUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.allowedUserService.remove(id);
  }
}