import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CourierSignalRService {

  private hubConnection!: signalR.HubConnection;
  public messages$ = new BehaviorSubject<any[]>([]);

  constructor() {}

  startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://your-backend-url/chatHub')
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch(err => console.error(err));

    this.hubConnection.on('ReceiveMessage', (message: any) => {
      const current = this.messages$.value;
      this.messages$.next([...current, message]);
    });
  }

  sendMessage(message: any) {
    this.hubConnection.invoke('SendMessage', message)
      .catch(err => console.error(err));
  }
}
