import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection!: signalR.HubConnection;

  // Observables for components
  public location$ = new BehaviorSubject<{ lat: number; lng: number } | null>(null);
  public notifications$ = new BehaviorSubject<any>(null);
  public chatMessages$ = new BehaviorSubject<any>(null);

  constructor(private notificationService: NotificationService) { }

  public startConnection(token: string): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7180/hubs/courier-location', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    // Realtime location
    this.hubConnection.on('ReceiveLocation', (lat: number, lng: number) => {
      this.location$.next({ lat, lng });
    });

    // Notifications
    this.hubConnection.on('ReceiveNotification', (notif) => {
      console.log('🔥 Notification received:', notif);
      this.notificationService.showNotification({
        title: notif.title || 'إشعار جديد',
        message: notif.message,
        type: notif.type || 'info',
        sound: 'assets/sounds/ringtone-you-would-be-glad-to-know.ogg'
      });
    });



    // ✅ المهم: نرجّع الـ Promise
    return this.hubConnection
      .start()
      .then(() => {
        console.log('✅ SignalR connected');
      })
      .catch(err => {
        console.error('SignalR connection error:', err);
        throw err; // مهم
      });
  }


  // --- Courier location ---
  public sendLocation(lat: number, lng: number, orderId: number) {
    this.hubConnection.invoke('SendLocation', lat, lng, orderId)
      .catch(err => console.error(err));
  }

  public joinOrderGroup(orderId: string) {
    this.hubConnection.invoke('JoinOrderGroup', orderId)
      .catch(err => console.error(err));
  }

  public sendOrderNotification(orderId: number, title: string, message: string) {
    this.hubConnection.invoke('SendOrderNotification', orderId, title, message)
      .catch(err => console.error(err));
  }

  // --- Chat ---
  public connectChatHub(token: string) {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7180/chatHub', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('✅ ChatHub connected'))
      .catch(err => console.error(err));

    this.hubConnection.on('ReceiveMessage', (data: any) => {
      this.chatMessages$.next(data);
    });
  }

  public sendMessage(receiverUserId: string, message: string) {
    this.hubConnection.invoke('SendMessage', receiverUserId, message)
      .catch(err => console.error(err));
  }

  public stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop().then(() => console.log('🛑 SignalR Connection stopped'));
    }
  }
}
