import type { CommandTransport } from './transports/types';
import { LocalSimulationTransport } from './transports/LocalSimulationTransport';
import { FirebaseTransport } from './transports/FirebaseTransport';
import type { SyncCommand, PlayerStatus, PlayerId } from './types';
import { c2Transport } from './firebaseConfig';

class CommandBus {
  private transport: CommandTransport;
  private mode: 'simulation' | 'real';

  constructor() {
    this.mode = c2Transport === 'firebase' ? 'real' : 'simulation';
    
    if (this.mode === 'real') {
      this.transport = new FirebaseTransport();
    } else {
      this.transport = new LocalSimulationTransport();
    }
  }

  getMode() {
    return this.mode;
  }

  async connect(playerId: PlayerId | 'dashboard') {
    await this.transport.connect(playerId);
  }

  async sendCommand(command: Omit<SyncCommand, 'id' | 'timestamp'>) {
    await this.transport.sendCommand(command);
  }

  async sendHeartbeat(status: PlayerStatus) {
    await this.transport.sendHeartbeat(status);
  }

  onCommand(callback: (command: SyncCommand) => void) {
    this.transport.onCommand(callback);
  }

  onStatusUpdate(callback: (status: PlayerStatus) => void) {
    this.transport.onStatusUpdate(callback);
  }

  getTransportStatus() {
    return this.transport.getStatus();
  }
}

export const commandBus = new CommandBus();
