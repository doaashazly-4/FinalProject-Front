import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourierDataService, DeliveryJob, CourierStat, CourierEarnings, JobStatus } from '../../services/courier-data.service';
import { PushNotificationService } from '../../../shared/services/push-notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-courier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class CourierDashboardComponent implements OnInit {
  stats: CourierStat[] = [];
  activeJobs: DeliveryJob[] = [];
  availableJobs: DeliveryJob[] = [];
  jobs: DeliveryJob[] = [];
  earnings: CourierEarnings | null = null;
  isLoading = true;
  isAvailable = false;
  locationInterval: any;
  orderTimers: { [jobId: string]: any } = {};
  readonly PENDING_LOCATIONS_KEY = 'courier_pending_locations_v1';
  isOnline = navigator.onLine;
  showEndShiftSummary = false;
  endShiftSummary: any = null;
  newOrderNotification: DeliveryJob | null = null;

  // ===== Modals =====
  showProofModal = false;
  showFailedModal = false;

  constructor(private dataService: CourierDataService, private pushService: PushNotificationService) {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });
    window.addEventListener('offline', () => { this.isOnline = false; });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadEarnings();
    this.checkForNewOrders();
    this.pushService.requestPermissionAndRegister().catch(err => console.warn('Push init failed', err));
    setInterval(() => this.checkForNewOrders(), 30000);
    this.startAutoRefresh();
    this.syncQueuedJobActions();
  }

  // ===== Load Data =====
  loadEarnings(): void {
    this.dataService.getEarnings().subscribe({ next: e => this.earnings = e, error: err => console.error(err) });
  }

  loadData(): void {
    this.isLoading = true;
    this.dataService.getStats().subscribe({ next: s => this.stats = s, error: () => this.stats = [] });
    this.dataService.getActiveJobs().subscribe({ next: j => this.activeJobs = j, error: () => this.activeJobs = [] });
    this.dataService.getAvailableJobs().subscribe({
      next: j => { this.availableJobs = j.slice(0, 3); this.isLoading = false },
      error: () => { this.availableJobs = []; this.isLoading = false }
    });
    this.dataService.getMyJobs().subscribe({ next: j => this.jobs = j, error: () => this.jobs = [] });
  }

  toggleAvailability(): void {
    const newAvailability = !this.isAvailable;
    this.dataService.toggleAvailability(newAvailability).subscribe({
      next: () => {
        if (newAvailability) this.startLocationTracking();
        else { this.stopLocationTracking(); this.showEndShiftSummaryModal(); }
        this.isAvailable = newAvailability;
      },
      error: err => console.error(err)
    });
  }

  // ===== Job Status Management =====
  updateJobStatus(job: DeliveryJob, status: JobStatus, photos?: File[], otp?: string) {
    const additionalData = { photos, otp };
    if (!this.isOnline) {
      this.queueJobAction({ type: 'updateStatus', jobId: job.id, status, photos, otp });
      job.status = status;
      return;
    }

    this.dataService.updateJobStatus(job.id, status, undefined, additionalData).subscribe({
      next: () => job.status = status,
      error: (err) => {
        console.error(err);
        this.queueJobAction({ type: 'updateStatus', jobId: job.id, status, photos, otp });
        job.status = status;
      }
    });
  }

  acceptJob(job: DeliveryJob): void {
    this.dataService.acceptJob(job.id).subscribe({
      next: () => {
        this.availableJobs = this.availableJobs.filter(j => j.id !== job.id);
        job.status = 'accepted' as JobStatus;
        this.activeJobs.push(job);
        if (this.orderTimers[job.id]) { clearTimeout(this.orderTimers[job.id]); delete this.orderTimers[job.id]; }
      },
      error: (err) => { console.error(err); alert('حدث خطأ أثناء قبول المهمة'); }
    });
  }

  rejectJob(job: DeliveryJob, reason?: string): void {
    this.dataService.rejectJob(job.id, reason).subscribe({
      next: () => { this.availableJobs = this.availableJobs.filter(j => j.id !== job.id); },
      error: (err) => { console.error(err); alert('حدث خطأ أثناء رفض المهمة'); }
    });
  }

  getStatusText(status: JobStatus): string {
    const map: { [key in JobStatus]: string } = {
      available: 'متاح',
      accepted: 'تم القبول',
      picked_up: 'تم الاستلام',
      in_transit: 'قيد التوصيل',
      out_for_delivery: 'وصلت للمنطقة',
      delivered: 'تم التسليم',
      failed: 'فشل',
      returned: 'مُرتجع'
    };
    return map[status] || status;
  }

  getStatusClass(status: JobStatus): string {
    const map: { [key in JobStatus]: string } = {
      available: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      in_transit: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      returned: 'bg-orange-100 text-orange-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  }

  // ===== Stat Icon Background =====
  getStatIconBg(index: number): string {
    const classes = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500'];
    return classes[index % classes.length];
  }

  // ===== Offline Queue =====
  queueJobAction(action: { type: 'accept' | 'reject' | 'updateStatus', jobId: string, status?: JobStatus, reason?: string, photos?: File[], otp?: string }) {
    try {
      const raw = localStorage.getItem('courier_pending_actions_v1');
      const list = raw ? JSON.parse(raw) : [];
      list.push(action);
      localStorage.setItem('courier_pending_actions_v1', JSON.stringify(list));
    } catch (e) { console.warn(e); }
  }

  syncQueuedJobActions() {
    try {
      const raw = localStorage.getItem('courier_pending_actions_v1');
      const list: any[] = raw ? JSON.parse(raw) : [];
      if (!list || list.length === 0) return;

      const actionsToSend = [...list];
      const sendNext = () => {
        if (actionsToSend.length === 0) { localStorage.removeItem('courier_pending_actions_v1'); return; }
        const act = actionsToSend.shift();
        let obs: Observable<any> | undefined;

        if (act.type === 'accept') obs = this.dataService.acceptJob(act.jobId);
        else if (act.type === 'reject') obs = this.dataService.rejectJob(act.jobId, act.reason);
        else if (act.type === 'updateStatus') 
          obs = this.dataService.updateJobStatus(act.jobId, act.status as JobStatus, act.reason, { photos: act.photos, otp: act.otp });

        obs?.subscribe(
          () => sendNext(),
          () => { localStorage.setItem('courier_pending_actions_v1', JSON.stringify([act, ...actionsToSend])); }
        );
      };
      sendNext();
    } catch (e) { console.warn(e); }
  }

  // ===== Location Tracking =====
  startLocationTracking(): void { /* محتوى موجود عندك */ }
  stopLocationTracking(): void { /* محتوى موجود عندك */ }
  queueLocation(lat: number, lng: number): void { /* محتوى موجود عندك */ }
  flushPendingLocations(): void { /* محتوى موجود عندك */ }
  syncOfflineData(): void { this.flushPendingLocations(); this.syncQueuedJobActions(); }

  // ===== New Orders =====
  checkForNewOrders(): void { /* محتوى موجود عندك */ }
  showNewOrderNotification(job: DeliveryJob): void { /* محتوى موجود عندك */ }
  playNotificationSound(): void { /* محتوى موجود عندك */ }
  dismissNotification(): void { this.newOrderNotification = null; }
  viewNewOrder(): void { if (this.newOrderNotification) window.location.href = `/courier/delivery/${this.newOrderNotification.id}`; }

  // ===== End Shift Summary =====
  showEndShiftSummaryModal(): void { /* محتوى موجود عندك */ }
  closeEndShiftSummary(): void { this.showEndShiftSummary = false; this.endShiftSummary = null; }

  // ===== Auto Refresh =====
  startAutoRefresh() { setInterval(() => { if (this.isOnline) { this.loadEarnings(); this.loadData(); } }, 60000); }

  callSender(phone: string) { window.open(`tel:${phone}`, '_self'); }
  callReceiver(phone: string) { window.open(`tel:${phone}`, '_self'); }

  // ===== Delivery Proof Modals =====
  handleDeliveryComplete(event: any) { this.showProofModal = false; this.updateJobStatus(event.job, 'delivered', event.photos, event.otp); }
  cancelModal() { this.showProofModal = false; this.showFailedModal = false; }
  handleDeliveryFailure(event: any) { this.showFailedModal = false; this.updateJobStatus(event.job, 'failed', event.photos); }

}
