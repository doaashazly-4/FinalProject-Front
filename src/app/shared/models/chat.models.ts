export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: Date;
    isRead: boolean;
    type: 'text' | 'image' | 'file';
    fileUrl?: string;
}

export interface ChatParticipant {
    id: string;
    name: string;
    avatar?: string;
    role: 'supplier' | 'courier' | 'customer';
    isOnline: boolean;
    lastSeen?: Date;
}

export interface ChatConversation {
    id: string;
    participants: ChatParticipant[];
    lastMessage?: ChatMessage;
    unreadCount: number;
    type: 'direct' | 'group';
}
