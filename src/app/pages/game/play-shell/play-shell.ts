import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ClerkService } from 'ngx-clerk';
import { filter, map, startWith, take } from 'rxjs/operators';
import { GameStateService } from '../../../services/game-state.service';
import { GameClockService } from '../../../services/game-clock.service';
import { Modal } from '../../../components/modal/modal';
import { WelcomeBackModal } from '../../../components/welcome-back-modal/welcome-back-modal';
import { PixelIcon } from '../../../components/pixel-icon/pixel-icon';
import { PIXEL_MAPS } from '../../../data/pixel-maps';

/**
 * Persistent in-game shell: renders the HUD (identity, clock, Branks, IQ, net worth) and hosts a
 * <router-outlet> for the active section. Navigation lives on the Home map hub; sections show a
 * "Back to Map" button instead of a top nav bar. Boots the shared game state once on init and
 * tears it down (timers + websocket) on destroy.
 */
@Component({
  selector: 'app-play-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, Modal, WelcomeBackModal, PixelIcon],
  templateUrl: './play-shell.html',
  styleUrl: './play-shell.css',
})
export class PlayShell implements OnInit, OnDestroy {
  readonly state = inject(GameStateService);
  readonly clock = inject(GameClockService);
  private clerk = inject(ClerkService);
  private router = inject(Router);

  readonly maps = PIXEL_MAPS;

  /** Current URL as a signal, so the "Back to Map" button hides on the Home hub itself. */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isHome = computed(() => {
    const u = this.currentUrl().split('?')[0].replace(/\/$/, '');
    return u.endsWith('/play');
  });

  ngOnInit() {
    this.state.boot();
  }

  ngOnDestroy() {
    this.state.teardown();
  }

  signOut() {
    this.clerk.clerk$.pipe(take(1)).subscribe((clerk) => {
      clerk.signOut().then(() => this.router.navigate(['/']));
    });
  }
}
