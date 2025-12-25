import { Component ,OnInit } from '@angular/core';

import { CourierDataService } from '../../services/courier-data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-shift',
  imports: [],
  templateUrl: './shift.component.html',
  styleUrl: './shift.component.css'
})
export class ShiftComponent implements OnInit {

  shiftData: any;

  constructor(
    private courierService: CourierDataService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  endShift() {
    this.courierService.endShift().subscribe({
      next: (res: any) => {
        this.shiftData = res;
        this.snackBar.open('تم إنهاء المناوبة بنجاح', 'اغلاق', { duration: 3000 });
        this.drawComparisonChart();
      },
      error: (err) => console.error(err)
    });
  }

  generatePDF() {
    if(!this.shiftData) return;
    const doc = new jsPDF();
    doc.text('تقرير المناوبة', 14, 20);
    (doc as any).autoTable({
      head: [['الطلب', 'الوقت', 'الحالة', 'المبلغ']],
      body: this.shiftData.orders.map((o: any) => [o.id, o.time, o.status, o.amount])
    });
    doc.save('ShiftReport.pdf');
  }

  drawComparisonChart() {
    if(!this.shiftData?.previousDays) return;
    const ctx: any = document.getElementById('comparisonChart');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.shiftData.previousDays.map((d: any) => d.date),
        datasets: [
          { label: 'الطلبات', data: this.shiftData.previousDays.map((d: any) => d.ordersCount), backgroundColor: '#00bfa5' },
          { label: 'الأرباح', data: this.shiftData.previousDays.map((d: any) => d.totalAmount), backgroundColor: '#009e8f' }
        ]
      }
    });
  }

  shareReport() {
    if (!this.shiftData) return;

    const report = new Blob([JSON.stringify(this.shiftData)], { type: 'application/json' });

    if (navigator.share) {
      navigator.share({
        title: 'تقرير المناوبة',
        files: [new File([report], 'ShiftReport.json', { type: 'application/json' })]
      }).then(() => console.log('تمت المشاركة'))
        .catch(err => console.error(err));
    } else {
      alert('المشاركة غير مدعومة في المتصفح هذا');
    }
  }
}