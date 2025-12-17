import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

interface Stat {
  value: string;
  label: string;
  icon: string;
}

interface Service {
  icon: string;
  title: string;
  description: string;
}

interface Step {
  number: string;
  title: string;
  description: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Testimonial {
  name: string;
  role: string;
  comment: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
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
    ])
  ]
})
export class HomeComponent implements OnInit {
  isScrolled = false;
  
  stats: Stat[] = [
    { value: '50K+', label: 'عميل سعيد', icon: 'bi-people-fill' },
    { value: '100K+', label: 'طلب منجز', icon: 'bi-box-seam-fill' },
    { value: '4.9', label: 'تقييم العملاء', icon: 'bi-star-fill' }
  ];

  services: Service[] = [
    {
      icon: 'bi-lightning-charge-fill',
      title: 'توصيل سريع',
      description: 'توصيل خلال 24 ساعة لجميع المناطق مع تتبع مباشر لطلبك في الوقت الحقيقي'
    },
    {
      icon: 'bi-geo-alt-fill',
      title: 'تتبع مباشر',
      description: 'تتبع شحنتك لحظة بلحظة من خلال تطبيقنا أو الموقع الإلكتروني'
    },
    {
      icon: 'bi-headset',
      title: 'دعم 24/7',
      description: 'فريق دعم متاح على مدار الساعة لمساعدتك في أي استفسار'
    }
  ];

  steps: Step[] = [
    {
      number: '1',
      title: 'اطلب منتجك',
      description: 'اختر المنتجات التي تريدها من المتاجر المفضلة لديك بسهولة'
    },
    {
      number: '2',
      title: 'اختر موصلاً',
      description: 'اختر الموصل الأنسب لك بناءً على التقييم والسعر والموقع'
    },
    {
      number: '3',
      title: 'استلم طلبك',
      description: 'استلم طلبك بسرعة وأمان عند باب منزلك مع ضمان الجودة'
    }
  ];

  features: Feature[] = [
    {
      icon: 'bi-shield-check',
      title: 'موثوقية عالية',
      description: 'نضمن لك تجربة توصيل موثوقة وآمنة في كل مرة'
    },
    {
      icon: 'bi-clock',
      title: 'توصيل في الوقت المحدد',
      description: 'نلتزم بالمواعيد ونوصل طلباتك في الوقت المحدد دون تأخير'
    },
    {
      icon: 'bi-cash-coin',
      title: 'أسعار تنافسية',
      description: 'نقدم أفضل الأسعار لخدمات التوصيل دون المساومة على الجودة'
    },
    {
      icon: 'bi-award',
      title: 'جودة مضمونة',
      description: 'جميع موصلينا مدربون ومعتمدون لضمان أفضل خدمة'
    }
  ];

  testimonials: Testimonial[] = [
    {
      name: 'أحمد محمد',
      role: 'عميل منتظم',
      comment: 'خدمة ممتازة وسريعة! طلبي وصل في أقل من ساعة. أنصح الجميع بتجربة PickGo'
    },
    {
      name: 'سارة العلي',
      role: 'مُرسلة طلبات',
      comment: 'كمُرسلة، وجدت في PickGo الشريك المثالي. التواصل سهل والتوصيل دقيق جداً'
    },
    {
      name: 'خالد الحربي',
      role: 'مندوب توصيل',
      comment: 'منصة رائعة للعمل! الدخل ممتاز والمرونة في العمل تناسب جدولي تماماً'
    }
  ];

  ngOnInit() {
    // Initialize component
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  
}
