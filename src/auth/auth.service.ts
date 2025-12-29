import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {  Repository } from 'typeorm';
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/createUserDto";

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
     private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
  const { telefono } = createUserDto;

  // Buscar usuario existente
  let user = await this.userRepository.findOneBy({ telefono });

  if (!user) {
    user = this.userRepository.create({
      telefono,
      isVerified: false,
    });
  }

  const codigo = this.generarCodigo();
  user.codigoExpiraEn = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  await this.userRepository.save(user);

  console.log('Código OTP:', codigo);

  return { message: 'Código enviado' };
}

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

 
  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

   generarCodigo(): string {
   return Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
  }



  async verifyCode(dto: VerifyCodeDto) {
  const { telefono, codigo } = dto;

  const user = await this.userRepository.findOneBy({ telefono });

  if (!user) throw new UnauthorizedException('Usuario no existe');
  if (!user.codigoExpiraEn || user.codigoExpiraEn < new Date())
    throw new UnauthorizedException('Código expirado');

  // Aquí validarías el código real (hash o OTP generado)
  // Por simplicidad, vamos a asumir que lo comparas directamente:
  if (codigo !== '123456') throw new UnauthorizedException('Código inválido');

  user.isVerified = true;
  await this.userRepository.save(user);

  const payload = { sub: user.id, telefono: user.telefono };
  const token = this.jwtService.sign(payload);

  return { access_token: token };
}


}

