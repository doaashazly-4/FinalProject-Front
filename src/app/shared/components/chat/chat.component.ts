import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  standalone: true
})


export class ChatComponent implements AfterViewChecked {

  @Input() messages: any[] = [];
  @Output() sendMessage = new EventEmitter<any>();

  messageText: string = '';
  selectedImage: File | null = null;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  onSend() {
    if (!this.messageText && !this.selectedImage) return;

    this.sendMessage.emit({
      text: this.messageText,
      image: this.selectedImage
    });

    this.messageText = '';
    this.selectedImage = null;
  }

  onImageSelected(event: any) {
    this.selectedImage = event.target.files[0];
  }
}
