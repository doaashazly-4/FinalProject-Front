import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatConversation, ChatMessage } from '../models/chat.models';

export interface Message {
  id?: number;
  senderId: string;
  receiverId: string;
  orderId?: string;
  messageText: string;
  senderName?: string;
  status?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection!: signalR.HubConnection;
  private messagesSource = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSource.asObservable();

  public connectionStatus = new BehaviorSubject<'Connected' | 'Disconnected' | 'Connecting'>('Disconnected');

  private chatTrigger = new BehaviorSubject<{ receiverId: string, receiverName: string, orderId?: string } | null>(null);
  public chatTrigger$ = this.chatTrigger.asObservable();
  

  constructor() { }

  public triggerChat(receiverId: string, receiverName: string, orderId?: string, ) {
    this.chatTrigger.next({ receiverId, receiverName, orderId,  });
  }

  public async startConnection() {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    // 🔹 إنشاء HubConnection مرة واحدة فقط
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.chatHubUrl, {
        accessTokenFactory: () => localStorage.getItem('lynx_token') || ''
      })
      .withAutomaticReconnect()
      .build();

    this.connectionStatus.next('Connecting');

    try {
      await this.hubConnection.start();
      console.log('SignalR Connected');
      this.connectionStatus.next('Connected');
      this.registerHandlers();
    } catch (err) {
      console.error('Error connecting SignalR: ', err);
      this.connectionStatus.next('Disconnected');
    }
  }

  private registerHandlers() {
    // استقبال رسالة جديدة
    this.hubConnection.on('ReceiveMessage', (message: Message) => {
      const current = this.messagesSource.getValue();
      this.messagesSource.next([...current, message]);
    });

    // استقبال المحادثة بالكامل
    this.hubConnection.on('ReceiveConversation', (messages: Message[]) => {
      this.messagesSource.next(messages);
    });
  }

  // إرسال رسالة
  public async sendMessage(senderId: string, receiverId: string, messageText: string, orderId?: string) {
    // 🔹 تأكد من الاتصال قبل الإرسال
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('SignalR not connected. Trying to start connection...');
      await this.startConnection();
    }

    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.error('Cannot send message: SignalR still not connected');
      return;
    }

    try {
      await this.hubConnection.invoke('SendMessage', senderId, receiverId, messageText, orderId);
    } catch (err) {
      console.error('Error sending message: ', err);
    }
  }

  // جلب المحادثة بين طرفين
  public async getConversation(user1Id: string, user2Id: string, orderId?: string) {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      await this.startConnection();
    }

    try {
      if (orderId) {
        await this.hubConnection.invoke('GetOrderConversation', user1Id, user2Id, orderId);
      } else {
        await this.hubConnection.invoke('GetConversation', user1Id, user2Id);
      }
    } catch (err) {
      console.error('Error getting conversation: ', err);
    }
  }

  public stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.connectionStatus.next('Disconnected');
    }
  }

  // Compatibility methods for ChatPageComponent
  public getConversations(): Observable<ChatConversation[]> {
    return of([]); // TODO: Implement server-side fetching
  }

  public getMessages(conversationId: string): Observable<ChatMessage[]> {
    return of([]); // TODO: Implement server-side fetching
  }

  private activeReceiverId!: string;

setActiveChat(receiverId: string) {
  this.activeReceiverId = receiverId;
}


}


  

