import type { SyncCommand, PlayerStatus, PlayerId } from '../types';

export interface CommandTransport {
  connect(playerId: PlayerId | 'dashboard'): Promise<void>;
  disconnect(): void;
  
  // Para el Dashboard: Enviar comandos
  sendCommand(command: Omit<SyncCommand, 'id' | 'timestamp'>): Promise<void>;
  
  // Para el Player: Reportar estado
  sendHeartbeat(status: PlayerStatus): Promise<void>;
  
  // Eventos
  onCommand(callback: (command: SyncCommand) => void): void;
  onStatusUpdate(callback: (status: PlayerStatus) => void): void;
  
  getStatus(): 'connected' | 'disconnected' | 'connecting';
}
