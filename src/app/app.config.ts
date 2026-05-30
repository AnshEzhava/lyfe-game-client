import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { ClerkService } from 'ngx-clerk';
import { dark } from '@clerk/themes';
import { routes } from './app.routes';

function initClerk(clerkService: ClerkService) {
  return () =>
    clerkService.__init({
      publishableKey: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'pk_test_c2VsZWN0ZWQtc29sZS0yNS5jbGVyay5hY2NvdW50cy5kZXYk'
        : 'pk_live_Y2xlcmsubHlmZS5hbnNoLmNvZGVzJA',
      afterSignInUrl: '/game/play',
      afterSignUpUrl: '/game/play',
      appearance: {
        baseTheme: dark,
      },
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initClerk,
      deps: [ClerkService],
      multi: true,
    },
  ],
};
