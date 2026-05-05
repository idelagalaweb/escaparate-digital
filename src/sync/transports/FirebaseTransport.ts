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
      console.error('[FirebaseTransport] ❌ Error: Base de datos no inicializada.');
      return;
    }
    
    this.playerId = playerId;
    this.setStatus('connecting');

    // IMPORTANTE: La ruta debe ser exactamente la misma para emisor y receptor
    const baseRef = siteId; // Ejemplo: 'delagala-escaparate-01'
    const commandsPath = `${baseRef}/commands`;
    
    console.log(`[FirebaseTransport] 📡 [${playerId}] Escuchando comandos en: ${commandsPath}`);
    console.log(`[FirebaseTransport] 🆔 SiteID: ${siteId}`);

    const commandsRef = ref(this.db, commandsPath);
    const connectionTime = Date.now();

    // Usamos onValue para detectar cualquier cambio en la lista de comandos
    onValue(commandsRef, (snapshot) => {
      console.log(`[FirebaseTransport] 📥 Snapshot recibido desde: ${commandsPath}`);
      const data = snapshot.val();
      
      if (!data) {
        console.log('[FirebaseTransport] ℹ️ No hay comandos en la ruta.');
        return;
      }
      
      // Obtenemos el comando más reciente de la lista
      const keys = Object.keys(data);
      const lastKey = keys[keys.length - 1];
      const command = data[lastKey] as SyncCommand;

      console.log(`[FirebaseTransport] 🧐 Analizando comando: ${command.type}`, {
        target: command.target,
        me: this.playerId,
        timestamp: command.timestamp,
        connTime: connectionTime
      });

      // FILTRO DE SEGURIDAD (Relajado para depuración)
      const isTarget = command.target === 'all' || command.target === this.playerId;
      
      // Aceptamos el comando si es para nosotros
      if (isTarget) {
        console.log(`[FirebaseTransport] ✅ Comando ACEPTADO: ${command.type}`);
        this.commandCallbacks.forEach(cb => cb(command));
      } else {
        console.log(`[FirebaseTransport] ❌ Comando IGNORADO: No es para este target (${command.target})`);
      }
    }, (error) => {
      console.error('[FirebaseTransport] ❌ Error en el listener de comandos:', error);
    });

    // Dashboard: Monitorizar todos los reproductores
    if (playerId === 'dashboard') {
      const playersPath = `${baseRef}/players`;
      console.log(`[FirebaseTransport] 👀 Dashboard monitorizando: ${playersPath}`);
      onValue(ref(this.db, playersPath), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        Object.values(data).forEach((status: any) => {
          this.statusCallbacks.forEach(cb => cb(status));
        });
      });
    } else {
      // Player: Registro y gestión de desconexión
      const myStatusPath = `${baseRef}/players/${playerId}`;
      const myStatusRef = ref(this.db, myStatusPath);
      console.log(`[FirebaseTransport] 💓 Heartbeat configurado en: ${myStatusPath}`);
      
      onDisconnect(myStatusRef).update({ 
        online: false, 
        lastHeartbeat: serverTimestamp() 
      }).catch(err => console.error('[FirebaseTransport] ❌ Error onDisconnect:', err));
    }

    this.setStatus('connected');
  }

  disconnect(): void {
    this.setStatus('disconnected');
  }

  async sendCommand(command: Omit<SyncCommand, 'id' | 'timestamp'>): Promise<void> {
    if (!this.db) return;
    const commandsPath = `${siteId}/commands`;
    const commandsRef = ref(this.db, commandsPath);
    const newCommandRef = push(commandsRef);
    
    console.log(`[FirebaseTransport] 📤 ESCRIBIENDO en: ${commandsPath}`, command);
    
    await set(newCommandRef, {
      ...command,
      id: newCommandRef.key,
      timestamp: serverTimestamp()
    }).catch(err => console.error('[FirebaseTransport] ❌ Error al escribir comando:', err));
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
