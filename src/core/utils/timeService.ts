export class TimeService {
  private static DEFAULT_TIMEZONE = 'Europe/Madrid';

  /**
   * Obtiene el timestamp UTC actual.
   * Es la base de toda la sincronización.
   */
  static getNowUTC(): number {
    return Date.now(); // Date.now() siempre devuelve UTC unix timestamp independientemente del sistema
  }

  /**
   * Obtiene la hora formateada para una zona horaria específica.
   * Útil para mostrar en diagnósticos.
   */
  static getFormattedTime(timezone: string = this.DEFAULT_TIMEZONE): string {
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date());
  }

  /**
   * Calcula el desfase (en ms) entre la hora del sistema y una hora de referencia (NTP).
   * En el futuro, esto se sincronizará con el backend.
   */
  static getSystemOffset(): number {
    // Por ahora asumimos 0, pero la arquitectura está lista para recibir un offsetNTP
    return 0;
  }

  static getNormalizedTimestamp(): number {
    return this.getNowUTC() + this.getSystemOffset();
  }
}
