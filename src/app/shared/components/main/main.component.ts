import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslatePipe],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-30px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('0.8s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('fadeInRight', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate('0.8s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('slideInUp', [
      transition(':enter', [
        query('.stat-item', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('slideInCards', [
      transition(':enter', [
        query('.service-card', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(150, [
            animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('bounceIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
  ]
})
export class MainComponent implements OnInit {
  isScrolled = false;

  // Data moved to translations, but we keep structure here if needed for iteration
  // or use directly in template with keys
  // For simplicity, we'll iterate over keys in template or arrays of keys locally

  stats = [
    { value: '50K+', label: 'HERO.STAT_CUSTOMERS', icon: 'smile', color: 'text-amber-500' },
    { value: '100K+', label: 'HERO.STAT_ORDERS', icon: 'check-circle', color: 'text-green-500' },
    { value: '24/7', label: 'HERO.STAT_SUPPORT', icon: 'headset', color: 'text-blue-500' }
  ];

  services = [
    {
      icon: 'zap',
      title: 'SERVICES.SPEED_TITLE',
      description: 'SERVICES.SPEED_DESC',
      color: '#3B82F6'
    },
    {
      icon: 'shield-check',
      title: 'SERVICES.SECURE_TITLE',
      description: 'SERVICES.SECURE_DESC',
      color: '#10B981'
    },
    {
      icon: 'truck',
      title: 'SERVICES.FREE_TITLE',
      description: 'SERVICES.FREE_DESC',
      color: '#8B5CF6'
    }
  ];

  steps = [
    {
      number: '1',
      title: 'STEPS.STEP1_TITLE',
      description: 'STEPS.STEP1_DESC',
      icon: 'search'
    },
    {
      number: '2',
      title: 'STEPS.STEP2_TITLE',
      description: 'STEPS.STEP2_DESC',
      icon: 'shopping-cart'
    },
    {
      number: '3',
      title: 'STEPS.STEP3_TITLE',
      description: 'STEPS.STEP3_DESC',
      icon: 'package-check'
    }
  ];

  features = [
    {
      icon: 'clock',
      title: 'FEATURES.F1_TITLE',
      description: 'FEATURES.F1_DESC'
    },
    {
      icon: 'tag',
      title: 'FEATURES.F2_TITLE',
      description: 'FEATURES.F2_DESC'
    },
    {
      icon: 'award',
      title: 'FEATURES.F3_TITLE',
      description: 'FEATURES.F3_DESC'
    },
    {
      icon: 'headphones',
      title: 'FEATURES.F4_TITLE',
      description: 'FEATURES.F4_DESC'
    }
  ];

  ngOnInit() {
    console.log('MainComponent initialized');
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  getServiceDelay(index: number): string {
    return `${index * 0.1}s`;
  }
}
