import type { CommandTransport } from './types';
import type { SyncCommand, PlayerStatus, PlayerId } from '../types';

export class LocalSimulationTransport implements CommandTransport {
  private channel: BroadcastChannel;
  private status: 'connected' | 'disconnected' = 'disconnected';
  private commandCallbacks: ((cmd: SyncCommand) => void)[] = [];
  private statusCallbacks: ((status: PlayerStatus) => void)[] = [];
  private statusChangeCallbacks: ((status: 'connected' | 'disconnected' | 'connecting') => void)[] = [];

  private setStatus(newStatus: 'connected' | 'disconnected' | 'connecting') {
    this.status = newStatus as any;
    this.statusChangeCallbacks.forEach(cb => cb(this.status as any));
  }

  constructor() {
    this.channel = new BroadcastChannel('inmoia_local_sim');
    this.channel.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'HEARTBEAT') {
        this.statusCallbacks.forEach(cb => cb(data.payload));
      } else {
        this.commandCallbacks.forEach(cb => cb(data));
      }
    };
  }

  async connect(playerId: PlayerId | 'dashboard'): Promise<void> {
    this.setStatus('connected');
    console.warn(`[SIMULATION] Connected as ${playerId}. Solo visible en este navegador.`);
  }

  disconnect(): void {
    this.setStatus('disconnected');
  }

  async sendCommand(command: Omit<SyncCommand, 'id' | 'timestamp'>): Promise<void> {
    const fullCommand: SyncCommand = {
      ...command,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    this.channel.postMessage(fullCommand);
  }

  async sendHeartbeat(status: PlayerStatus): Promise<void> {
    this.channel.postMessage({ type: 'HEARTBEAT', payload: status });
  }

  onCommand(callback: (command: SyncCommand) => void): void {
    this.commandCallbacks.push(callback);
  }

  onStatusUpdate(callback: (status: PlayerStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  getStatus(): "connected" | "disconnected" | "connecting" {
    return this.status as any;
  }

  onStatusChange(callback: (status: "connected" | "disconnected" | "connecting") => void): void {
    this.statusChangeCallbacks.push(callback);
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }
}
