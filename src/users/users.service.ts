import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'auth/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  

  findAll() {
    return this.userRepository.find();
  }

  findOne(id: string) {
    return  this.userRepository.findOneBy({ id });
  }

  async update(id: string, dto: UpdateUserDto) {

    const user = await this.findOne(id);
    if(!user) throw new Error('Usuario no encontrado');
    
    Object.assign(user, dto);
    return this.userRepository.save(user);

  }

  async remove(id: string) {
    

    const user = await this.findOne(id);
    if(!user) throw new Error('Usuario no encontrado');

    await this.userRepository.delete(id);
    return { message: 'Usuario eliminado' };

  }
}
