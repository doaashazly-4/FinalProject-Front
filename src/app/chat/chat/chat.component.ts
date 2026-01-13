import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatService, Message } from '../../shared/services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {

  receiverId!: string;
  receiverName!: string;
  orderId?: string;
  messages: Message[] = [];
  newMessage: string = '';
  messagesSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('courierId');
      this.receiverId = id || '';
    });

    this.route.queryParamMap.subscribe(qParams => {
      this.receiverName = qParams.get('name') || 'المندوب';
      this.orderId = qParams.get('parcelId') || undefined;
    });

    if (!this.receiverId) return;

    // جلب المحادثة الحالية
    this.chatService.getConversation('current_user_id', this.receiverId, this.orderId);

    // الاستماع للرسائل الجديدة
    this.messagesSub = this.chatService.messages$.subscribe(msgs => {
      // فلتر الرسائل اللي تخص المحادثة الحالية
      this.messages = msgs.filter(m =>
        (m.senderId === this.receiverId || m.receiverId === this.receiverId)
        && m.orderId === this.orderId
      );
      setTimeout(() => this.scrollToBottom(), 50);
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    this.chatService.sendMessage('current_user_id', this.receiverId, this.newMessage, this.orderId);
    this.newMessage = '';
  }

  scrollToBottom(): void {
    const container = document.getElementById('messagesContainer');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  ngOnDestroy(): void {
    if (this.messagesSub) this.messagesSub.unsubscribe();
  }
}
