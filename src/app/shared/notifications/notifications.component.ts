import { Component, OnInit } from '@angular/core';
import { NotificationService, AppNotification } from '../../shared/services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notification: AppNotification | null = null;

  constructor(private notificationService: NotificationService) {}


ngOnInit() {
  this.notificationService.notifications$.subscribe(notif => {
    this.notification = notif;

    if (notif) {
      setTimeout(() => this.notification = null, 5000); // يختفي بعد 5 ثواني
    }
  });
}


//   this.notificationService.showNotification({
//   title: 'اختبار',
//   message: 'ده إشعار تجريبي',
//   type: 'info',
//   sound: 'assets/sounds/ringtone-you-would-be-glad-to-know.ogg'
// });
}


