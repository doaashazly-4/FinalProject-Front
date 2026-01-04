import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CourierDataService, DeliveryJob, CourierStat, CourierEarnings, JobStatus } from '../../services/courier-data.service';
import { PushNotificationService } from '../../../shared/services/push-notification.service';
import { Observable } from 'rxjs';
import { DeliveryProofComponent } from '../delivery/components/delivery-proof.component';
import { FailedDeliveryProofComponent } from '../delivery/components/failed-delivery-proof.component';


@Component({
  selector: 'app-courier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DeliveryProofComponent, FailedDeliveryProofComponent],
  imports: [CommonModule, RouterModule, DeliveryProofComponent, FailedDeliveryProofComponent],
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
  selectedJobForProof: DeliveryJob | null = null;
  selectedJobForProof: DeliveryJob | null = null;

  constructor(
    private dataService: CourierDataService,
    private pushService: PushNotificationService,
    private router: Router
  ) {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadEarnings();
    this.loadAvailability();
    this.loadAvailability();
    // this.checkForNewOrders();
    this.pushService.requestPermissionAndRegister().catch(err => console.warn('Push init failed', err));
    //setInterval(() => this.checkForNewOrders(), 30000);
    // this.startAutoRefresh();
    this.syncQueuedJobActions();
  }




  toggleAvailability(): void {
    const newAvailability = !this.isAvailable;

    // غيّر حالة الزر فورًا لإحساس التفاعل
    this.isAvailable = newAvailability;

    if (newAvailability) {
      // الضغط على "متاح" → شغّل التتبع
      this.dataService.toggleAvailability().subscribe({
        next: res => {
          console.log('Courier is now AVAILABLE');
        },
        error: err => {
          console.error('Error toggling availability:', err);
          this.isAvailable = !newAvailability; // ارجع الحالة القديمة عند الخطأ
        }
      });
    } else {
      // الضغط على "غير متاح" → انهي المناوبة وادخل صفحة End Shift    
      this.dataService.endShift().subscribe({
        next: res => {
          console.log('Shift ended successfully');

          // استخدم فقط Arrays اللي سيرفر بيرجعها لتجنب NG0900
          const safeOrders = Array.isArray(res.orders) ? res.orders : [];
          const safePreviousDays = Array.isArray(res.previousDays) ? res.previousDays : [];

          // اعرض صفحة End Shift مع البيانات
          this.router.navigate(['courier/endshift'], { state: { orders: safeOrders, previousDays: safePreviousDays } });

          // بعد نهاية الشفت، المندوب يصبح غير متاح تلقائيًا
          this.isAvailable = false;
        },
        error: err => {
          console.error('Error ending shift:', err);
          this.isAvailable = newAvailability; // ارجع الحالة القديمة عند الخطأ
        }
      });
    }
  }

  // ===== Load Data =====
  loadEarnings(): void {
    this.dataService.getEarnings().subscribe({
      next: e => {
        console.log(e);

        this.earnings = e
      }, error: err => console.error(err)
    });
  }

  loadAvailability(): void {
    this.dataService.getAvailability().subscribe({
      next: (res: { isAvailable: boolean }) => {
        console.log(res);

        this.isAvailable = res.isAvailable;
      },
      error: (err) => {
        console.error('Failed to load availability:', err);
      }
    });
  }
  loadAvailability(): void {
    this.dataService.getAvailability().subscribe({
      next: (res: { isAvailable: boolean }) => {
        console.log(res);

        this.isAvailable = res.isAvailable;
      },
      error: (err) => {
        console.error('Failed to load availability:', err);
      }
    });
  }






  loadData(): void {
    this.isLoading = true;
  loadData(): void {
    this.isLoading = true;


    this.dataService.getStats().subscribe({
      next: (s: CourierStat[]) => this.stats = Array.isArray(s) ? s : [],
      error: () => this.stats = []
    });
    this.dataService.getStats().subscribe({
      next: (s: CourierStat[]) => this.stats = Array.isArray(s) ? s : [],
      error: () => this.stats = []
    });

    this.dataService.getActiveJobs().subscribe({
      next: (j: DeliveryJob[]) => this.activeJobs = Array.isArray(j) ? j : [],
      error: () => this.activeJobs = []
    });
    this.dataService.getActiveJobs().subscribe({
      next: (j: DeliveryJob[]) => this.activeJobs = Array.isArray(j) ? j : [],
      error: () => this.activeJobs = []
    });

    this.dataService.getAvailableJobs().subscribe({
      next: (j: DeliveryJob[]) => this.availableJobs = Array.isArray(j) ? j.slice(0, 3) : [],
      error: () => this.availableJobs = [],
      complete: () => this.isLoading = false
    });
    this.dataService.getAvailableJobs().subscribe({
      next: (j: DeliveryJob[]) => this.availableJobs = Array.isArray(j) ? j.slice(0, 3) : [],
      error: () => this.availableJobs = [],
      complete: () => this.isLoading = false
    });


    this.dataService.getMyJobs().subscribe({
      next: (j) => {
        console.log("jobs", j);
        this.jobs = j
      }, error: (err) => { console.log(err); this.jobs = [] }
    });
  }


  goToEndShift(): void {
    this.router.navigate(['/courier/shift']);
  }

  // ===== Job Status Management =====
  updateJobStatus(job: DeliveryJob, status: JobStatus, photos?: File[], otp?: string) {
    const additionalData = { photos, otp };
    if (!this.isOnline) {
      this.queueJobAction({ type: 'updateStatus', jobId: job.id, status, photos, otp });
      job.status = status;
      return;
    }

    this.dataService.updateJobStatus(Number(job.id), status, undefined, additionalData).subscribe({
      next: (res) => {
        console.log("updateJobStatus", res);
        console.log("updateJobStatus", res);
        job.status = status
      },
      error: (err) => {
        console.error(err);
        this.queueJobAction({ type: 'updateStatus', jobId: job.id, status, photos, otp });
        job.status = status;
      }
    });
  }

  acceptJob(job: DeliveryJob): void {
    this.dataService.acceptJob(Number(job.id)).subscribe({
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
  queueJobAction(action: { type: 'accept' | 'reject' | 'updateStatus', jobId: string | number, status?: JobStatus, reason?: string, photos?: File[], otp?: string }) {
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
  startLocationTracking(): void {
    if (this.locationInterval) clearInterval(this.locationInterval);

    // Send location immediately then every 10s
    this.sendLocationUpdate();
    this.locationInterval = setInterval(() => {
      this.sendLocationUpdate();
    }, 10000);
  }

  stopLocationTracking(): void {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }
  }

  private sendLocationUpdate(): void {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (this.isOnline) {
          this.dataService.addLocation(latitude, longitude).subscribe({
            error: (err) => console.error('Location update failed', err)
          });
        }
      },
      (err) => console.error('Geolocation error', err),
      { enableHighAccuracy: true }
    );
  }

  queueLocation(lat: number, lng: number): void { /* No-op for now unless offline queue needed */ }
  flushPendingLocations(): void { /* No-op */ }
  syncOfflineData(): void { this.syncQueuedJobActions(); }

  // ===== New Orders =====
  checkForNewOrders(): void { /* implemented via polling/signalr elsewhere */ }
  showNewOrderNotification(job: DeliveryJob): void { /* ... */ }
  playNotificationSound(): void { /* ... */ }
  dismissNotification(): void { this.newOrderNotification = null; }
  viewNewOrder(): void { if (this.newOrderNotification) window.location.href = `/courier/delivery/${this.newOrderNotification.id}`; }

  // ===== End Shift Summary =====
  showEndShiftSummaryModal(): void { /* ... */ }
  closeEndShiftSummary(): void { this.showEndShiftSummary = false; this.endShiftSummary = null; }

  // ===== Auto Refresh =====
  startAutoRefresh() { setInterval(() => { if (this.isOnline) { this.loadEarnings(); this.loadData(); } }, 60000); }

  callSender(phone: string) { window.open(`tel:${phone}`, '_self'); }
  callReceiver(phone: string) { window.open(`tel:${phone}`, '_self'); }

  // ===== Delivery Proof Modals =====
  openProofModal(job: DeliveryJob): void {
    this.selectedJobForProof = job;
    this.showProofModal = true;
  }

  openFailedModal(job: DeliveryJob): void {
    this.selectedJobForProof = job;
    this.showFailedModal = true;
  }

  handleDeliveryComplete(event: any) {
    this.showProofModal = false;
    if (this.selectedJobForProof && event.otp) {
      // Use deliverPackage for OTP validation + status update
      // event.photos handling might need to be separate or the backend handles it in simple update
      // Assuming deliverPackage is sufficient for the requirements
      this.dataService.deliverPackage(Number(this.selectedJobForProof.id), event.otp).subscribe({
        next: () => {
          this.selectedJobForProof!.status = 'delivered';
          this.selectedJobForProof = null;
          this.loadData(); // Refresh to move to completed
        },
        error: (err) => {
          console.error('Delivery failed', err);
          alert('فشل التحقق من رمز OTP');
        }
      });
    } else if (this.selectedJobForProof) {
      // Fallback or just photos?
      this.updateJobStatus(this.selectedJobForProof, 'delivered', event.photos);
      this.selectedJobForProof = null;
    }
  }

  cancelModal() {
    this.showProofModal = false;
    this.showFailedModal = false;
    this.selectedJobForProof = null;
  }

  handleDeliveryFailure(event: any) {
    this.showFailedModal = false;
    if (this.selectedJobForProof) {
      this.updateJobStatus(this.selectedJobForProof, 'failed', event.photos);
      this.selectedJobForProof = null;
    }
  }

}
