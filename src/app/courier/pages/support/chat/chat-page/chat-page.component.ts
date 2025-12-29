import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '../../../../../shared/components/chat/chat.component';
import { CourierSignalRService } from '../../../../services/courier-signalr.service';
import { CourierDataService } from '../../../../services/courier-data.service';
import { Subscription } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ChatComponent, MatSnackBarModule],
  templateUrl: './chat-page.component.html'
})
export class ChatPageComponent implements OnInit, OnDestroy {

  messages: any[] = [];
  sub!: Subscription;

  constructor(
    private signalRService: CourierSignalRService,
    private courierService: CourierDataService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.signalRService.startConnection();

    this.sub = this.signalRService.messages$.subscribe(msgs => {
      this.messages = msgs;

      const lastMsg = msgs[msgs.length - 1];
      if(lastMsg?.sender === 'support') {
        this.snackBar.open('💬 لديك رسالة جديدة من الدعم!', 'اغلاق', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  async sendMessage(event: any) {
    let imageUrl: string | null = null;

    if(event.image) {
      const formData = new FormData();
      formData.append('image', event.image);

      const res: any = await this.courierService.uploadImage(formData).toPromise();
      imageUrl = res.url;
    }

    const msg = {
      text: event.text,
      imageUrl: imageUrl,
      sender: 'user'
    };

    this.signalRService.sendMessage(msg);
  }
}
