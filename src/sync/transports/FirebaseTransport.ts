import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, serverTimestamp, onDisconnect, update, query, limitToLast, onChildAdded } from 'firebase/database';
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

    const baseRef = siteId;
    const commandsPath = `${baseRef}/commands`;
    
    // Referencia y Query
    const commandsRef = ref(this.db, commandsPath);
    // Escuchamos solo el último comando para evitar procesar historial antiguo al conectar
    const recentCommandsQuery = query(commandsRef, limitToLast(1));

    console.log(`[FirebaseTransport] 📡 [${playerId}] Iniciando escucha en: ${commandsRef.toString()}`);

    // Cambiamos onValue por onChildAdded para una respuesta más limpia a nuevos eventos
    onChildAdded(recentCommandsQuery, (snapshot) => {
      console.log(`[FirebaseTransport] 📥 NUEVO HIJO detectado en: ${commandsPath}`);
      const command = snapshot.val() as SyncCommand;
      
      if (!command) {
        console.log('[FirebaseTransport] ⚠️ Snapshot vacío.');
        return;
      }

      console.log(`[FirebaseTransport] 🧐 Procesando: ${command.type}`, {
        id: snapshot.key,
        target: command.target,
        timestamp: command.timestamp
      });

      // Filtro de Target
      const isTarget = command.target === 'all' || command.target === this.playerId;
      
      if (isTarget) {
        console.log(`[FirebaseTransport] ✅ EJECUTANDO: ${command.type}`);
        this.commandCallbacks.forEach(cb => cb(command));
      } else {
        console.log(`[FirebaseTransport] ❌ IGNORADO: Target no coincide (${command.target})`);
      }
    }, (error) => {
      console.error('[FirebaseTransport] ❌ Error crítico en listener:', error);
    });

    // Dashboard: Monitorizar todos los reproductores
    if (playerId === 'dashboard') {
      const playersPath = `${baseRef}/players`;
      const playersRef = ref(this.db, playersPath);
      console.log(`[FirebaseTransport] 👀 Dashboard monitorizando: ${playersRef.toString()}`);
      onValue(playersRef, (snapshot) => {
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
      console.log(`[FirebaseTransport] 💓 Heartbeat en: ${myStatusRef.toString()}`);
      
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
    
    console.log(`[FirebaseTransport] 📤 ESCRIBIENDO en: ${newCommandRef.toString()}`, command);
    
    await set(newCommandRef, {
      ...command,
      id: newCommandRef.key,
      timestamp: serverTimestamp()
    }).catch(err => console.error('[FirebaseTransport] ❌ Error de escritura:', err));
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
