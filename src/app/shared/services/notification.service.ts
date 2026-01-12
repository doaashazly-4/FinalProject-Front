import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppNotification {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'error';
  sound?: string; // اسم ملف صوت لو عايزة
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<AppNotification | null>(null);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() { }

  showLynxNotification(title: string, message: string) {
    this.showNotification({
      title: '✨ Lynx Talisman',
      message: `${title}: ${message}`,
      type: 'success', // We can use custom styles or just leverage 'success' with the prefix
      sound: 'assets/sounds/notification.mp3'
    });
  }

  showNotification(notification: AppNotification) {
    // Trigger the notification
    this.notificationsSubject.next(notification);

    // Optional: play sound
    if (notification.sound) {
      const audio = new Audio(notification.sound);
      audio.play();
    }
  }
}
