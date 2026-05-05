import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, serverTimestamp, onDisconnect, update } from 'firebase/database';
import type { CommandTransport } from './types';
import type { SyncCommand, PlayerStatus, PlayerId } from '../types';
import { firebaseConfig, siteId } from '../firebaseConfig';

export class FirebaseTransport implements CommandTransport {
  private db: any;
  private status: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private commandCallbacks: ((cmd: SyncCommand) => void)[] = [];
  private statusCallbacks: ((status: PlayerStatus) => void)[] = [];
  private statusChangeCallbacks: ((status: 'connected' | 'disconnected' | 'connecting') => void)[] = [];
  private playerId: PlayerId | 'dashboard' | null = null;

  private setStatus(newStatus: 'connected' | 'disconnected' | 'connecting') {
    this.status = newStatus;
    this.statusChangeCallbacks.forEach(cb => cb(newStatus));
  }

  constructor() {
    console.log('[FirebaseTransport] Iniciando con SiteID:', siteId);
    console.log('[FirebaseTransport] API Key configurada:', firebaseConfig.apiKey ? 'SÍ' : 'NO');
    console.log('[FirebaseTransport] DB URL:', firebaseConfig.databaseURL ? 'CONFIGURADA' : 'VACÍA');

    // Solo inicializamos si tenemos las credenciales mínimas
    if (!firebaseConfig.apiKey) {
      console.warn('[FirebaseTransport] API Key no configurada. Trabajando en modo dummy.');
      return;
    }
    try {
      const app = initializeApp(firebaseConfig);
      this.db = getDatabase(app);
      console.log('[FirebaseTransport] Firebase inicializado correctamente.');
    } catch (err) {
      console.error('[FirebaseTransport] Error al inicializar Firebase:', err);
    }
  }

  async connect(playerId: PlayerId | 'dashboard'): Promise<void> {
    if (!this.db) return;
    
    this.playerId = playerId;
    this.setStatus('connecting');

    const baseRef = `${siteId}`;

    const connectionTime = Date.now();
    const commandsRef = ref(this.db, `${baseRef}/commands`);
    
    // Solo escuchamos el último comando para evitar procesar historial antiguo
    onValue(commandsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const keys = Object.keys(data);
      const lastKey = keys[keys.length - 1];
      const command = data[lastKey] as SyncCommand;

      // CRÍTICO: Solo ejecutar si el comando es NUEVO (enviado después de conectar)
      // O si no tiene timestamp (para simulaciones)
      if (!command.timestamp || command.timestamp > connectionTime) {
        if (command.target === 'all' || command.target === this.playerId) {
          this.commandCallbacks.forEach(cb => cb(command));
        }
      }
    });

    // Dashboard: Monitorizar todos los reproductores del site
    if (playerId === 'dashboard') {
      const playersRef = ref(this.db, `${baseRef}/players`);
      onValue(playersRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        Object.values(data).forEach((status: any) => {
          this.statusCallbacks.forEach(cb => cb(status));
        });
      });
    } else {
      // Player: Registro y gestión de desconexión (Heartbeat Offline Fallback)
      const myStatusRef = ref(this.db, `${baseRef}/players/${playerId}`);
      onDisconnect(myStatusRef).update({ online: false, lastHeartbeat: serverTimestamp() });
    }

    this.setStatus('connected');
  }

  disconnect(): void {
    this.setStatus('disconnected');
  }

  async sendCommand(command: Omit<SyncCommand, 'id' | 'timestamp'>): Promise<void> {
    if (!this.db) return;
    const commandsRef = ref(this.db, `${siteId}/commands`);
    const newCommandRef = push(commandsRef);
    await set(newCommandRef, {
      ...command,
      id: newCommandRef.key,
      timestamp: serverTimestamp()
    });
  }

  async sendHeartbeat(status: PlayerStatus): Promise<void> {
    if (!this.db || !this.playerId || this.playerId === 'dashboard') return;
    const statusRef = ref(this.db, `${siteId}/players/${this.playerId}`);
    await update(statusRef, {
      ...status,
      lastHeartbeat: serverTimestamp(),
      online: true
    });
  }

  onCommand(callback: (command: SyncCommand) => void): void {
    this.commandCallbacks.push(callback);
  }

  onStatusUpdate(callback: (status: PlayerStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  getStatus(): 'connected' | 'disconnected' | 'connecting' {
    return this.status;
  }

  onStatusChange(callback: (status: 'connected' | 'disconnected' | 'connecting') => void): void {
    this.statusChangeCallbacks.push(callback);
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }
}
