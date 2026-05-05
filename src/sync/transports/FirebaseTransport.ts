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
    console.log('[FirebaseTransport] 🏗️ Iniciando con SiteID:', siteId);
    console.log('[FirebaseTransport] 🔑 Configuración detectada:', {
      apiKey: firebaseConfig.apiKey ? 'PRESENT' : 'MISSING',
      dbUrl: firebaseConfig.databaseURL ? 'PRESENT' : 'MISSING',
      projectId: firebaseConfig.projectId ? 'PRESENT' : 'MISSING'
    });

    if (!firebaseConfig.apiKey) {
      console.warn('[FirebaseTransport] ⚠️ API Key no configurada. Trabajando en modo local.');
      return;
    }
    try {
      const app = initializeApp(firebaseConfig);
      this.db = getDatabase(app);
      console.log('[FirebaseTransport] ✅ Firebase inicializado correctamente.');
    } catch (err) {
      console.error('[FirebaseTransport] ❌ Error al inicializar Firebase:', err);
    }
  }

  async connect(playerId: PlayerId | 'dashboard'): Promise<void> {
    if (!this.db) {
      console.error('[FirebaseTransport] ❌ Intento de conexión sin DB inicializada.');
      return;
    }
    
    this.playerId = playerId;
    this.setStatus('connecting');

    const baseRef = `${siteId}`;
    console.log(`[FirebaseTransport] 🔌 Conectando como [${playerId}] a [${baseRef}]`);

    // Buffer de tiempo de 10 segundos hacia el pasado para compensar desfases de reloj
    const connectionTime = Date.now() - 10000; 
    const commandsRef = ref(this.db, `${baseRef}/commands`);
    
    // Escuchamos comandos
    onValue(commandsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const keys = Object.keys(data);
      const lastKey = keys[keys.length - 1];
      const command = data[lastKey] as SyncCommand;

      console.log(`[FirebaseTransport] 📥 Comando recibido en DB: ${command.type}`, {
        cmdTime: command.timestamp,
        connTime: connectionTime,
        diff: command.timestamp ? command.timestamp - connectionTime : 'N/A'
      });

      // Si el comando es nuevo o no tiene timestamp, y va dirigido a nosotros
      if (!command.timestamp || command.timestamp > connectionTime) {
        if (command.target === 'all' || command.target === this.playerId) {
          console.log(`[FirebaseTransport] 🎯 Ejecutando comando: ${command.type}`);
          this.commandCallbacks.forEach(cb => cb(command));
        }
      } else {
        console.log(`[FirebaseTransport] ⏳ Saltando comando antiguo: ${command.type}`);
      }
    });

    // Dashboard: Monitorizar todos los reproductores del site
    if (playerId === 'dashboard') {
      const playersRef = ref(this.db, `${baseRef}/players`);
      console.log('[FirebaseTransport] 👀 Dashboard escuchando cambios en /players');
      onValue(playersRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        Object.values(data).forEach((status: any) => {
          this.statusCallbacks.forEach(cb => cb(status));
        });
      });
    } else {
      // Player: Registro y gestión de desconexión
      const myStatusRef = ref(this.db, `${baseRef}/players/${playerId}`);
      console.log(`[FirebaseTransport] 💓 Player [${playerId}] configurando onDisconnect`);
      onDisconnect(myStatusRef).update({ 
        online: false, 
        lastHeartbeat: serverTimestamp() 
      }).catch(err => console.error('[FirebaseTransport] Error onDisconnect:', err));
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
    console.log(`[FirebaseTransport] 📤 Enviando comando a la nube: ${command.type}`, command);
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
