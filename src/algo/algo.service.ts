import { Injectable } from '@nestjs/common';
import { CreateAlgoDto } from './dto/create-algo.dto';
import { UpdateAlgoDto } from './dto/update-algo.dto';

@Injectable()
export class AlgoService {
  create(createAlgoDto: CreateAlgoDto) {
    return 'This action adds a new algo';
  }

  findAll() {
    return `This action returns all algo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} algo`;
  }

  update(id: number, updateAlgoDto: UpdateAlgoDto) {
    return `This action updates a #${id} algo`;
  }

  remove(id: number) {
    return `This action removes a #${id} algo`;
  }
}
