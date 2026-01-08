import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { SeedsService } from './seed.service';

//Comentar para pruebas, DESCOMENTAR EN PRODUCCIÓN
//@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('seeds')
export class SeedsController {
  constructor(private readonly seedsService: SeedsService) {}

  @Post('run')
  @Roles(UserRole.ADMIN) // solo admin puede ejecutar seeds
  async runSeed() {
    return this.seedsService.runSeed();
  }
}