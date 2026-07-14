import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClerkService } from 'ngx-clerk';
import { map, take } from 'rxjs/operators';

/**
 * Protects the in-game routes: allows navigation only when a Clerk session exists,
 * otherwise redirects to the auth screen. Clerk is initialized via APP_INITIALIZER,
 * so the session stream is ready by the time this runs.
 */
export const authGuard: CanActivateFn = () => {
  const clerk = inject(ClerkService);
  const router = inject(Router);

  return clerk.user$.pipe(
    take(1),
    map((user) => (user ? true : router.createUrlTree(['/game/auth']))),
  );
};
