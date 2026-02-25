import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// Permitimos CORS para que tu frontend se conecte
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'alarms',
})
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

sendAlarmToAdmin(empresaId: number, alarma: any) {
  // Solo los que estén en la sala de la empresa reciben el mensaje
  this.server.to(`company-${empresaId}`).emit('new-alarm', alarma);
this.logger.log(`🚀 Disparando evento 'new-alarm' a la sala: company-${empresaId}`);}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }
}