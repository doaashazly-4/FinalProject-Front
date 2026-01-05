import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ChatConversation, ChatMessage, ChatParticipant } from '../models/chat.models';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private conversationsSubject = new BehaviorSubject<ChatConversation[]>([]);
    private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);

    constructor() {
        this.loadMockData();
    }

    getConversations(): Observable<ChatConversation[]> {
        return this.conversationsSubject.asObservable();
    }

    getMessages(conversationId: string): Observable<ChatMessage[]> {
        // In a real app, this would fetch from an API based on conversationId
        return this.messagesSubject.asObservable();
    }

    sendMessage(conversationId: string, content: string, senderId: string, senderName: string): void {
        const newMessage: ChatMessage = {
            id: Math.random().toString(36).substring(7),
            senderId,
            senderName,
            content,
            timestamp: new Date(),
            isRead: false,
            type: 'text'
        };

        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, newMessage]);

        // Update last message in conversation
        const currentConversations = this.conversationsSubject.value;
        const conversationIndex = currentConversations.findIndex(c => c.id === conversationId);
        if (conversationIndex !== -1) {
            currentConversations[conversationIndex].lastMessage = newMessage;
            this.conversationsSubject.next([...currentConversations]);
        }
    }

    private loadMockData(): void {
        const mockParticipants: ChatParticipant[] = [
            { id: 'courier-1', name: 'أحمد مندوب', role: 'courier', isOnline: true },
            { id: 'customer-1', name: 'سارة عميل', role: 'customer', isOnline: false },
            { id: 'supplier-1', name: 'متجر الأنوار', role: 'supplier', isOnline: true }
        ];

        const mockConversations: ChatConversation[] = [
            {
                id: 'conv-1',
                participants: [mockParticipants[0], mockParticipants[2]],
                unreadCount: 2,
                type: 'direct',
                lastMessage: {
                    id: 'm1',
                    senderId: 'courier-1',
                    senderName: 'أحمد مندوب',
                    content: 'أنا قريب من موقع الاستلام الآن',
                    timestamp: new Date(),
                    isRead: false,
                    type: 'text'
                }
            },
            {
                id: 'conv-2',
                participants: [mockParticipants[1], mockParticipants[2]],
                unreadCount: 0,
                type: 'direct',
                lastMessage: {
                    id: 'm2',
                    senderId: 'customer-1',
                    senderName: 'سارة عميل',
                    content: 'متى سيصل الطلب؟',
                    timestamp: new Date(Date.now() - 3600000),
                    isRead: true,
                    type: 'text'
                }
            }
        ];

        this.conversationsSubject.next(mockConversations);

        // Initial messages for the first conversation
        this.messagesSubject.next([
            {
                id: 'm01',
                senderId: 'supplier-1',
                senderName: 'متجر الأنوار',
                content: 'مرحباً أحمد، الطلب جاهز للتسليم',
                timestamp: new Date(Date.now() - 7200000),
                isRead: true,
                type: 'text'
            },
            {
                id: 'm1',
                senderId: 'courier-1',
                senderName: 'أحمد مندوب',
                content: 'أنا قريب من موقع الاستلام الآن',
                timestamp: new Date(),
                isRead: false,
                type: 'text'
            }
        ]);
    }
}
