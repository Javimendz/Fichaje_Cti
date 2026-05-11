import { Controller, Get, Post, UnauthorizedException, UseGuards, Headers, Body, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles.enum';
import { SeedsService } from './seed.service';
import { ConfigService } from '@nestjs/config';

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
  constructor(private readonly seedsService: SeedsService, private readonly configService: ConfigService) {}

  
 @Post('run')
  async executeSeed(
    // 1. Capturamos el header 'x-seed-key'
    @Headers('x-seed-key') seedKey: string 
  ) {
    // 2. Validamos que el cliente haya enviado la cabecera
    if (!seedKey) {
      throw new UnauthorizedException('Falta la cabecera x-seed-key');
    }

    // 3. Pasamos el argumento al servicio (Esto elimina el error TS2554)
    return await this.seedsService.runSeed(seedKey);
  }
@Post('generate-workers')
async createTestWorkers(
  @Headers('x-seed-key') clientKey: string,
  @Body('empresaId') empresaId: number,
  @Body('cantidad') cantidadStr?: any, 
) {
  this.validateKey(clientKey);
  if (!empresaId) throw new UnauthorizedException('Debes proporcionar un empresaId');

  // Forzamos a que sea un número válido, si no, usamos 100
  const cantidad = Number(cantidadStr) || 100;

  return await this.seedsService.createBulkWorkers(empresaId, cantidad);
}

  // Método privado para no repetir la validación de la clave
  private validateKey(clientKey: string) {
    const serverKey = this.configService.get('SEED_SECRET_KEY');
    if (!clientKey || clientKey !== serverKey) {
      throw new UnauthorizedException('Clave de seguridad inválida');
    }
  }

  @Delete('borrar-demo')
async clearDemo(
  @Headers('x-seed-key') clientKey: string 
) {
  // Validamos la clave (usando el mismo método de validación que ya tenemos)
  this.validateKey(clientKey);

return await this.seedsService.clearDemoUsers();

}

}