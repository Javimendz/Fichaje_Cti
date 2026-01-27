import { Controller, Get, Post, UnauthorizedException, UseGuards, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { SeedsService } from './seed.service';

/**
 * SeedsController
 * Controlador para la inicialización de datos básicos en el sistema.
 * Proporciona un endpoint para ejecutar el seed que crea usuarios esenciales
 * como el SuperAdmin, necesario para arrancar la aplicación.
 * Métodos principales:
 * - runSeed: Endpoint para ejecutar la inicialización de datos.
 * @see SeedsService para la lógica de inicialización de datos.
 * @controller 'seeds' define la ruta base para este controlador.
 * @UseGuards(AuthGuard('jwt'), RolesGuard) aplica los guardias de autenticación y autorización a todas las rutas del controlador.
 *  
 * 
 */
//Comentar para pruebas, DESCOMENTAR EN PRODUCCIÓN
//@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('seeds')
export class SeedsController {
  constructor(private readonly seedsService: SeedsService) {}

  
  @Post('run') // Endpoint para ejecutar el seed
  @Roles(UserRole.SUPERADMIN) // solo admin puede ejecutar seeds // En producción, cambiar a SUPERADMIN
async runSeed(@Headers('x-seed-key') key: string) {
  if (key !== process.env.SEED_SECRET_KEY) {
    throw new UnauthorizedException('No tienes permiso');
  }
    return this.seedsService.runSeed(); // Llamar al servicio para ejecutar el seed
  }

}