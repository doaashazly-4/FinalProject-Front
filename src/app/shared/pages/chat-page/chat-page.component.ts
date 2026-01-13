import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { ChatConversation, ChatMessage, ChatParticipant } from '../../models/chat.models';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-chat-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat-page.component.html',
    styleUrls: ['./chat-page.component.css']
})
export class ChatPageComponent implements OnInit, OnDestroy, AfterViewChecked {
    conversations: ChatConversation[] = [];
    selectedConversation: ChatConversation | null = null;
    messages: ChatMessage[] = [];
    newMessageText: string = '';
    currentUser: any = null;
    searchQuery: string = '';

    private subs = new Subscription();

    @ViewChild('messagesArea') private messagesArea!: ElementRef;

    constructor(
        private chatService: ChatService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        const user = this.authService.getCurrentUser();
        if (user && user.userId) {
            this.currentUser = { id: user.userId, name: user.userName || 'مستخدم' };
        } else {
            this.currentUser = { id: 'supplier-1', name: 'متجر الأنوار' }; // Fallback
        }

        this.subs.add(
            this.chatService.getConversations().subscribe((convs: ChatConversation[]) => {
                this.conversations = convs;
            })
        );
    }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }

    selectConversation(conv: ChatConversation): void {
        this.selectedConversation = conv;
        this.chatService.getMessages(conv.id).subscribe((msgs: ChatMessage[]) => {
            this.messages = msgs;
        });
        // Mark as read logic would go here
    }

    sendMessage(): void {
        if (!this.newMessageText.trim() || !this.selectedConversation) return;

        const partner = this.getPartner(this.selectedConversation);
        this.chatService.sendMessage(
            this.currentUser.id,
            partner.id,
            this.newMessageText
        );

        this.newMessageText = '';
    }

    get filteredConversations(): ChatConversation[] {
        if (!this.searchQuery) return this.conversations;
        return this.conversations.filter(c =>
            c.participants.some(p => p.name.includes(this.searchQuery))
        );
    }

    getPartner(conv: ChatConversation): ChatParticipant {
        return conv.participants.find(p => p.id !== this.currentUser.id) || conv.participants[0];
    }

    formatTime(date: Date): string {
        return new Date(date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    }

    private scrollToBottom(): void {
        if (this.messagesArea) {
            this.messagesArea.nativeElement.scrollTop = this.messagesArea.nativeElement.scrollHeight;
        }
    }
}
