import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../services/loader.service';

@Component({
    selector: 'app-loader',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="loaderService.isLoading$ | async" class="loader-overlay">
      <div class="loader-content">
        <img src="assets/Images/lynx-logo.png" alt="Lynx" class="loader-logo animate-pulse">
        <div class="loader-spinner"></div>
      </div>
    </div>
  `,
    styles: [`
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(5px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .loader-content {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .loader-logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      z-index: 2;
    }

    .loader-spinner {
      position: absolute;
      width: 120px;
      height: 120px;
      border: 3px solid transparent;
      border-top-color: #4CAF50; /* Primary Green */
      border-radius: 50%;
      animation: spin 1s linear infinite;
      z-index: 1;
    }
    
    .loader-spinner::before {
        content: "";
        position: absolute;
        top: 5px;
        left: 5px;
        right: 5px;
        bottom: 5px;
        border-radius: 50%;
        border: 3px solid transparent;
        border-top-color: #192A45; /* Primary Dark */
        animation: spin 3s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(0.95); }
    }
  `]
})
export class LoaderComponent {
    constructor(public loaderService: LoaderService) { }
}
