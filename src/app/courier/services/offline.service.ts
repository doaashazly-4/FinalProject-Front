import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

// ===== أنواع الأفعال الممكنة =====
export type ActionType =
  | 'UPDATE_STATUS'
  | 'DELIVERY_PROOF'
  | 'FAILED_DELIVERY'
  | 'RETURN_TO_SUPPLIER';

// ===== نقاط النهاية في API =====
export enum ApiEndpoint {
  UpdateStatus = '/Delivery/UpdateStatus',
  SubmitProof = '/Delivery/SubmitProof',
  ReportFailure = '/Delivery/ReportFailure',
  ReturnToSupplier = '/Delivery/AutoReturnToSupplier'
}

// ===== شكل الفعل المعلق =====
export interface PendingAction {
  id: string;
  actionType: ActionType;
  payload: any;
  endpoint: ApiEndpoint;
  method: 'POST' | 'PUT' | 'DELETE';
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  isSyncing: boolean;
}

@Injectable({ providedIn: 'root' })
export class OfflineService implements OnDestroy {
  private readonly STORE_NAME = 'pending_actions';
  private readonly SYNC_INTERVAL = 30000; // 30 ثانية

  private isOnline = navigator.onLine;
  private syncInterval?: any;

  onlineStatus$ = new BehaviorSubject<boolean>(this.isOnline);
  pendingActionsCount$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {
    this.setupNetworkListeners();
    this.startAutoSync();
    this.updatePendingCount();
  }

  // ===== مراقبة حالة الإنترنت =====
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onlineStatus$.next(true);
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onlineStatus$.next(false);
    });
  }

  get isCurrentlyOnline(): boolean {
    return this.isOnline;
  }

  // ===== إضافة فعل جديد للقائمة =====
  async queueAction(
    actionType: ActionType,
    payload: any,
    endpoint: ApiEndpoint,
    method: 'POST' | 'PUT' | 'DELETE' = 'POST',
    maxRetries: number = 3 // يمكن تعديل عدد المحاولات لكل فعل
  ): Promise<string> {
    const action: PendingAction = {
      id: this.generateId(),
      actionType,
      payload,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries,
      isSyncing: false
    };
    const actions = this.getLocalActions();
    actions.push(action);
    localStorage.setItem(this.STORE_NAME, JSON.stringify(actions));
    this.updatePendingCount();
    return action.id;
  }

  // ===== مزامنة كل الأفعال المعلقة =====
  async syncPendingActions(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline) return { success: 0, failed: 0 };
    const actions = this.getLocalActions().filter(a => !a.isSyncing);
    let success = 0;
    let failed = 0;

    for (const action of actions) {
      const ok = await this.syncSingleAction(action);
      ok ? success++ : failed++;
    }

    this.updatePendingCount();
    return { success, failed };
  }

  // ===== مزامنة فعل واحد =====
  private async syncSingleAction(action: PendingAction): Promise<boolean> {
    try {
      action.isSyncing = true;
      this.updateLocalAction(action);

      const url = environment.apiUrl + action.endpoint;
      let request$;
      switch (action.method) {
        case 'POST': request$ = this.http.post(url, action.payload); break;
        case 'PUT': request$ = this.http.put(url, action.payload); break;
        case 'DELETE': request$ = this.http.delete(url); break;
      }
      await firstValueFrom(request$!);
      this.removeLocalAction(action.id);
      return true;
    } catch {
      action.retryCount++;
      action.isSyncing = false;
      if (action.retryCount >= action.maxRetries) {
        this.removeLocalAction(action.id);
      } else {
        this.updateLocalAction(action);
      }
      return false;
    }
  }

  // ===== جلب الأفعال المعلقة من localStorage =====
  private getLocalActions(): PendingAction[] {
    return JSON.parse(localStorage.getItem(this.STORE_NAME) || '[]');
  }

  private updateLocalAction(action: PendingAction): void {
    const actions = this.getLocalActions();
    const i = actions.findIndex(a => a.id === action.id);
    if (i !== -1) actions[i] = action;
    localStorage.setItem(this.STORE_NAME, JSON.stringify(actions));
  }

  private updatePendingCount(): void {
    const actions = this.getLocalActions();
    this.pendingActionsCount$.next(actions.length);
  }

  private removeLocalAction(id: string): void {
    const actions = this.getLocalActions().filter(a => a.id !== id);
    localStorage.setItem(this.STORE_NAME, JSON.stringify(actions));
  }

  // ===== المزامنة التلقائية =====
  private startAutoSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline) this.syncPendingActions();
    }, this.SYNC_INTERVAL);
  }

  private generateId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  ngOnDestroy(): void {
    clearInterval(this.syncInterval);
  }

  // ===== الحصول على عدد الأفعال المعلقة مباشرة =====
  getPendingCount(): number {
    return this.getLocalActions().length;
  }

  // ===== دوال Offline إضافية مع default values =====
  async saveStatusUpdate(jobId: string, status: string, data: any = {}) {
    await this.queueAction('UPDATE_STATUS', data, ApiEndpoint.UpdateStatus);
  }

  async saveDeliveryProof(jobId: string, photoPreviews: string[] = [], otp?: string) {
    const payload = { jobId, photos: photoPreviews, otp };
    await this.queueAction('DELIVERY_PROOF', payload, ApiEndpoint.SubmitProof);
  }

  async saveFailedDelivery(jobId: string, reason: string = '', photos: string[] = [], notes?: string) {
    const payload = { jobId, reason, photos, notes };
    await this.queueAction('FAILED_DELIVERY', payload, ApiEndpoint.ReportFailure);
  }

  async saveReturnToSupplier(jobId: string, reason: string = '', isAutoReturn = false) {
    const payload = { jobId, reason, isAutoReturn };
    await this.queueAction('RETURN_TO_SUPPLIER', payload, ApiEndpoint.ReturnToSupplier);
  }
}

