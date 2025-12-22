import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type UserRole = 'customer' | 'courier' | 'admin' | 'supplier' | null;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'app_role';
  private roleSignal = signal<UserRole>(this.readFromStorage());
  
  // ⬇⬇⬇⬇⬇⬇⬇⬇⬇ غيري هنا ⬇⬇⬇⬇⬇⬇⬇⬇⬇
  private apiUrl = environment.apiUrl; 
  
  private readonly demoUsers = [
    { email: 'customer@test.com', password: '123456', role: 'customer' as const },
    { email: 'courier@test.com', password: '123456', role: 'courier' as const },
    { email: 'admin@test.com', password: '123456', role: 'admin' as const },
    { email: 'supplier@test.com', password: '123456', role: 'supplier' as const }
  ];

  constructor(private http: HttpClient) {}

  role = computed(() => this.roleSignal());

  login(role: Exclude<UserRole, null>) {
    this.roleSignal.set(role);
    localStorage.setItem(this.STORAGE_KEY, role);
  }

  logout() {
    this.roleSignal.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  loginWithCredentials(email: string, password: string): UserRole {
    // 1. استخدم الحسابات التجريبية أولاً
    const user = this.demoUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    if (user) {
      this.login(user.role);
      
      // 2. حاول تتصل بالباك الحقيقي
      this.tryRealLogin(email, password);
      
      return user.role;
    }
    
    return null;
  }

  private tryRealLogin(email: string, password: string) {
    // ⬇⬇⬇⬇⬇⬇⬇⬇⬇ هنا هيشتغل مع الباك بتاعك ⬇⬇⬇⬇⬇⬇⬇⬇⬇
    this.http.post(`${this.apiUrl}/auth/login`, { 
      email, 
      password 
    }).pipe(
      catchError(error => {
        console.log('⚠️ الباك مش شغال أو فيه مشكلة في الاتصال');
        console.log('التفاصيل:', error);
        return of(null);
      }),
      map((response: any) => {
        if (response && (response.success || response.token)) {
          console.log('✅ تم تسجيل الدخول من الباك:', response);
          
          let role: UserRole = null;
          if (response.user?.role === 'customer') role = 'customer';
          else if (response.user?.role === 'courier') role = 'courier';
          else if (response.user?.role === 'admin') role = 'admin';
          else if (response.user?.role === 'supplier') role = 'supplier';
          
          if (role) {
            this.login(role);
          }
          
          if (response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
          }
        }
        return response;
      })
    ).subscribe();
  }

  hasRole(required: Exclude<UserRole, null>[]): boolean {
    const current = this.roleSignal();
    return !!current && required.includes(current);
  }

  getDashboardRoute(): string | null {
    const role = this.roleSignal();
    if (role === 'customer') return '/customer';
    if (role === 'courier') return '/courier';
    if (role === 'admin') return '/admin';
    if (role === 'supplier') return '/supplier/dashboard';
    return null;
  }

  private readFromStorage(): UserRole {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'customer' || saved === 'courier' || saved === 'admin' || saved === 'supplier') return saved;
    return null;
  }
}