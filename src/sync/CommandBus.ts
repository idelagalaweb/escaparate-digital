import type { CommandTransport } from './transports/types';
import { LocalSimulationTransport } from './transports/LocalSimulationTransport';
import { FirebaseTransport } from './transports/FirebaseTransport';
import type { SyncCommand, PlayerStatus, PlayerId } from './types';
import { c2Transport, firebaseConfig } from './firebaseConfig';

class CommandBus {
  private transport!: CommandTransport;
  private mode: 'simulation' | 'real';
  private statusCallbacks: Set<(status: string) => void> = new Set();

  constructor() {
    const transportEnv = (import.meta.env.VITE_C2_TRANSPORT || 'local').toLowerCase();
    const hasKeys = !!firebaseConfig.apiKey;
    
    // Si el usuario pide firebase expresamente, intentamos usarlo.
    // Si no, caemos a simulación.
    if (transportEnv === 'firebase' && hasKeys) {
      this.mode = 'real';
    } else {
      this.mode = 'simulation';
    }
    
    console.log(`[CommandBus] 🚀 Modo inicializado: ${this.mode.toUpperCase()} (Env: ${transportEnv}, Keys: ${hasKeys ? 'SÍ' : 'NO'})`);
    this.initializeTransport();
  }

  private initializeTransport() {
    if (this.mode === 'real') {
      this.transport = new FirebaseTransport();
    } else {
      this.transport = new LocalSimulationTransport();
    }
    
    // Re-propagar callbacks de estado si el transporte cambia
    this.transport.onStatusChange((status) => {
      this.statusCallbacks.forEach(cb => cb(status));
    });
  }

  setMode(newMode: 'simulation' | 'real') {
    if (this.mode === newMode) return;
    this.mode = newMode;
    this.initializeTransport();
    this.connect('dashboard'); // Re-conectar automáticamente al cambiar
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

  onStatusChange(callback: (status: string) => void) {
    this.statusCallbacks.add(callback);
    this.transport.onStatusChange(callback);
  }

  getTransportStatus() {
    return this.transport.getStatus();
  }

  isConnected() {
    return this.transport.isConnected();
  }
}

export const commandBus = new CommandBus();
