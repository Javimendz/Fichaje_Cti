import { Injectable } from '@nestjs/common';
import { CreateCodigoAccesoDto } from './dto/create-codigo-acceso.dto';
import { UpdateCodigoAccesoDto } from './dto/update-codigo-acceso.dto';

@Injectable()
export class CodigoAccesoService {
  create(createCodigoAccesoDto: CreateCodigoAccesoDto) {
    return 'This action adds a new codigoAcceso';
  }

  findAll() {
    return `This action returns all codigoAcceso`;
  }

  findOne(id: number) {
    return `This action returns a #${id} codigoAcceso`;
  }

  update(id: number, updateCodigoAccesoDto: UpdateCodigoAccesoDto) {
    return `This action updates a #${id} codigoAcceso`;
  }

  remove(id: number) {
    return `This action removes a #${id} codigoAcceso`;
  }
}
