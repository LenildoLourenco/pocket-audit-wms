import { Injectable, signal } from '@angular/core';
import { AuditScanLog } from '../../features/audit/domain/product.model';

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  // Signal para monitorar se a aplicação tem internet ou não
  public isOnline = signal<boolean>(navigator.onLine);
  private DB_NAME = 'PocketAudit_WMS';

  constructor() {
    // Escuta nativamente as mudanças de rede do celular
    window.addEventListener('online', () => this.updateOnlineStatus(true));
    window.addEventListener('offline', () => this.updateOnlineStatus(false));
  }

  private updateOnlineStatus(status: boolean): void {
    this.isOnline.set(status);
    if (status) {
      this.syncLogsWithCloud();
    }
  }

  // Enfileira o bipe localmente (Pode ser estendido para IndexedDB)
  public saveScanLog(log: AuditScanLog): void {
    const currentLogs = this.getLocalLogs();
    currentLogs.push(log);
    localStorage.setItem(this.DB_NAME, JSON.stringify(currentLogs));
    
    if (this.isOnline()) {
      this.syncLogsWithCloud();
    }
  }

  public getLocalLogs(): AuditScanLog[] {
    const data = localStorage.getItem(this.DB_NAME);
    return data ? JSON.parse(data) : [];
  }

  // Simula a postagem assíncrona na API do TOTVS ou nuvem quando a internet volta
  private syncLogsWithCloud(): void {
    const pendingLogs = this.getLocalLogs();
    if (pendingLogs.length === 0) return;

    console.log(`📡 Sincronizando em background: ${pendingLogs.length} bipes enviados para a nuvem...`);
    
    // Sucesso no sync: Limpa a fila local
    localStorage.removeItem(this.DB_NAME);
  }
}