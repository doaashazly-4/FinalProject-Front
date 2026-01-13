import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Message } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() receiverId: string = '';
  @Input() receiverName: string = 'Support';
  @Input() orderId?: string;

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  messages: Message[] = [];
  newMessage: string = '';
  isOpen: boolean = false;
  currentUserId: string = '';

  private messagesSub!: Subscription;
  private triggerSub!: Subscription;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user.userId;

    this.messagesSub = this.chatService.messages$.subscribe(messages => {
      this.messages = messages;
      this.scrollToBottom();
    });

    this.triggerSub = this.chatService.chatTrigger$.subscribe(trigger => {
      if (trigger) {
        this.openChat(trigger.receiverId, trigger.receiverName, trigger.orderId);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.messagesSub) this.messagesSub.unsubscribe();
    if (this.triggerSub) this.triggerSub.unsubscribe();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  public openChat(receiverId: string, receiverName: string, orderId?: string) {
    this.receiverId = receiverId;
    this.receiverName = receiverName;
    this.orderId = orderId;
    this.isOpen = true;

    this.chatService.startConnection().then(() => {
      this.chatService.getConversation(this.currentUserId, this.receiverId, this.orderId);
    });
  }

  public closeChat() {
    this.isOpen = false;
  }

  send() {
    if (this.newMessage.trim() !== '' && this.receiverId) {
      this.chatService.sendMessage(this.currentUserId, this.receiverId, this.newMessage, this.orderId);
      this.newMessage = '';
    }
  }

  private scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  formatDate(date?: string) {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
