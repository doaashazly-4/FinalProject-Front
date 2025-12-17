import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'PickGo';
  showNavbar = true;
  showFooter = true;
  
  // Routes where navbar and footer should be hidden
  private hiddenRoutes = [
    '/customer',
    '/supplier',
    '/courier',
    '/admin'
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateLayoutVisibility(event.urlAfterRedirects);
    });
    
    // Check initial route
    this.updateLayoutVisibility(this.router.url);
  }

  private updateLayoutVisibility(url: string): void {
    // Check if current route starts with any of the hidden routes
    const shouldHide = this.hiddenRoutes.some(route => url.startsWith(route));
    this.showNavbar = !shouldHide;
    this.showFooter = !shouldHide;
  }
}
