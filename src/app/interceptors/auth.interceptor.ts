import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ClerkService } from 'ngx-clerk';
import { switchMap, take } from 'rxjs/operators';
import { from, of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const clerkService = inject(ClerkService);

  return clerkService.session$.pipe(
    take(1),
    switchMap((session) => {
      if (!session) {
        return next(req);
      }
      return from(session.getToken()).pipe(
        switchMap((token) => {
          if (token) {
            const cloned = req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`,
              },
            });
            return next(cloned);
          }
          return next(req);
        }),
      );
    }),
  );
};
