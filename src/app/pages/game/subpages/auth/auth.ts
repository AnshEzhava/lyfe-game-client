import { Component, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ClerkService, ClerkSignInComponent, ClerkSignUpComponent } from 'ngx-clerk';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ClerkSignInComponent, ClerkSignUpComponent],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('250ms 100ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class Auth {
  private clerkService = inject(ClerkService);
  private router = inject(Router);

  showSignIn = signal(true);
  user = toSignal(this.clerkService.user$);

  readonly signInProps = {
    forceRedirectUrl: '/game/play',
    appearance: {
      elements: {
        footer: 'clerk-footer-hidden',
        footerAction: 'clerk-footer-hidden',
      },
    },
  } as const;

  readonly signUpProps = {
    forceRedirectUrl: '/game/play',
    appearance: {
      elements: {
        footer: 'clerk-footer-hidden',
        footerAction: 'clerk-footer-hidden',
      },
    },
  } as const;

  constructor() {
    effect(() => {
      if (this.user()) {
        this.router.navigate(['/game/play']);
      }
    });
  }

  toggleMode() {
    this.showSignIn.update((v) => !v);
  }
}
