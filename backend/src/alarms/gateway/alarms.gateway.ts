import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';


 //
// Permitimos CORS para que tu frontend se conecte
/**
 * Decorador de configuración de WebSocket Gateway
 * Define la configuración CORS y el namespace para el gateway de alarmas
 * 
 * @configuracion
 * - CORS: Permite conexiones desde múltiples orígenes
 *   - localhost:3567 → Frontend Vite en desarrollo
 *   - URLs comentadas → Frontend producción y panel admin (desactivadas por defecto)
 * - Métodos HTTP permitidos: Todos los verbos estándar
 * - Credenciales: Habilitadas para soportar autenticación por cookies/headers
 * - Namespace: 'alarms' → Los clientes se conectan vía ws://servidor/alarms
 * 
 * @seguridad
 * - Validar y actualizar las URLs de origen antes de desplegar a producción
 * - Considerar implementar validación adicional de origen en el gateway
 */
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3567',          // Frontend en desarrollo (Vite)
      /*'https://tu-app-de-fichaje.com',  //  Frontend en producción
      'https://admin.tu-app.com'*/        // panel de administración
    ],
     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,                  // Obligatorio si usas Cookies o Auth Headers
  },
  namespace: 'alarms',
})
//  
export class AlarmsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AlarmsGateway');

  // Cambiamos la lógica para que el Admin se suscriba a su empresa
 @SubscribeMessage('join-company')

 handleJoinCompany(client: Socket, payload: { empresaId: number }) {
  const { empresaId } = payload;

  this.logger.log(`Admin ${client.id} unido a empresa ${empresaId}`);

  client.join(`company-${empresaId}`);
}

/**
 * Envía una alarma a todos los administradores conectados de una empresa específica
 * 
 * @param empresaId - ID de la empresa que recibirá la alarma
 * @param alarma - Objeto con los datos de la alarma a transmitir
 * 
 * @descripcion
 * - Emite el evento 'new-alarm' solo a los clientes conectados a la sala de la empresa
 * - Utiliza el patrón de nombres de sala 'company-{empresaId}' para segmentar por empresa
 * - Registra en logs el envío para auditoría y debugging
 * 
 * @ejemplo
 * // Cliente se une a la sala: socket.emit('join-company', { empresaId: 123 })
 * // Servidor envía alarma: sendAlarmToAdmin(123, { tipo: 'incidencia', mensaje: 'Puerta abierta' })
 */sendAlarmToAdmin(empresaId: number, alarma: any) {
  // Solo los que estén en la sala de la empresa reciben el mensaje
  this.server.to(`company-${empresaId}`).emit('new-alarm', alarma);
this.logger.log(`🚀 Disparando evento 'new-alarm' a la sala: company-${empresaId}`);}
/**
 * Manejador del evento de conexión de WebSocket
 * Se ejecuta automáticamente cuando un cliente se conecta al gateway
 * 
 * @param client - Socket del cliente conectado
 * 
 * @descripcion
 * - Registra en logs el ID del cliente para seguimiento y debugging
 * - Este método es parte del ciclo de vida del WebSocket gateway
 * - Útil para auditoría, métricas y troubleshooting de conexiones
 * 
 * @seguridad
 * - Considerar implementar validación de origen/token aquí
 * - Podrías rechazar la conexión si no cumple requisitos de autenticación
 */
  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }
/**
 * Manejador del evento de desconexión de WebSocket
 * Se ejecuta automáticamente cuando un cliente se desconecta del gateway
 * 
 * @param client - Socket del cliente que se desconectó
 * 
 * @descripcion
 * - Registra en logs el ID del cliente desconectado para auditoría
 * - Parte del ciclo de vida del WebSocket gateway
 * - Útil para limpieza de recursos, métricas y monitoreo de conexiones
 * 
 * @consideraciones
 * - Podrías implementar lógica de limpieza (ej: salir de todas las salas)
 * - Oportunidad para actualizar estado de usuarios en línea
 * - Revisar si el cliente tenía permisos/roles especiales antes de desconectar
 */
  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }
}