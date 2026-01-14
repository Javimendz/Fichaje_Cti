import { Injectable } from '@nestjs/common';
import { CreateAllowedUserDto } from './dto/create-allowed-user.dto';
import { UpdateAllowedUserDto } from './dto/update-allowed-user.dto';

@Injectable()
export class AllowedUserService {
  create(createAllowedUserDto: CreateAllowedUserDto) {
    return 'This action adds a new allowedUser';
  }

  findAll() {
    return `This action returns all allowedUser`;
  }

  findOne(id: number) {
    return `This action returns a #${id} allowedUser`;
  }

  update(id: number, updateAllowedUserDto: UpdateAllowedUserDto) {
    return `This action updates a #${id} allowedUser`;
  }

  remove(id: number) {
    return `This action removes a #${id} allowedUser`;
  }
}
