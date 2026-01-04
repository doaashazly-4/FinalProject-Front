import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { withInterceptors } from '@angular/common/http';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/shared/interceptors/auth.interceptor';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from './environments/environment';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';

registerLocaleData(localeAr);

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(), // ✅ THIS LINE FIXES THE ERROR
    provideHttpClient(
      withInterceptors([
        authInterceptor
      ])
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
    })
  ]
});
