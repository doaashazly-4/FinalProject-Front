import { Component, HostListener, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  isScrolled = false;
  currentUserRole: UserRole = null;
  userName: string = '';
  isMenuOpen = false;

  constructor(private auth: AuthService, private router: Router) {
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
      'customer': 'مُستلم',    // Receiver
      'supplier': 'مُرسل',     // Sender
      'courier': 'مندوب',      // Carrier
      'admin': 'مدير'          // Admin
    };
    
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

  @HostListener('window:scroll', ['$event'])
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
}
