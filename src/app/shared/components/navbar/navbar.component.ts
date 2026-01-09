import { Component, HostListener, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service';
import { LucideAngularModule } from 'lucide-angular';
import { TranslationService } from '../../../core/services/translation.service';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  isScrolled = false;
  currentUserRole: UserRole = null;
  userName: string = '';
  isMenuOpen = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    public translationService: TranslationService,
    public themeService: ThemeService
  ) {
    // Use effect to reactively update when auth state changes
    effect(() => {
      this.currentUserRole = this.auth.role();
      this.loadUserData();
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    const user = this.auth.getCurrentUser();
    this.currentUserRole = user.role;
    this.userName = user.userName;

    if (!this.userName && user.email) {
      this.userName = user.email.split('@')[0];
    }
  }

  get dashboardLink(): string | null {
    return this.auth.getDashboardRoute();
  }

  get isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  // Updated terminology: Supplier = Sender, Customer = Receiver
  getRoleTitle(): string {
    if (!this.currentUserRole) return '';

    const roleTitles: { [key: string]: string } = {
      'customer': this.translationService.translate('ROLES.RECEIVER'),
      'supplier': this.translationService.translate('ROLES.SENDER'),
      'courier': this.translationService.translate('ROLES.COURIER'),
      'admin': this.translationService.translate('ROLES.ADMIN')
    };

    // Fallback if translation missing or manual string
    return roleTitles[this.currentUserRole] || this.currentUserRole;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/home']);
    this.closeMenu();
  }

  getShortName(): string {
    if (!this.userName) return 'User';
    if (this.userName.length <= 10) return this.userName;
    return this.userName.substring(0, 8) + '...';
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleLanguage() {
    this.translationService.toggleLanguage();
  }
}
