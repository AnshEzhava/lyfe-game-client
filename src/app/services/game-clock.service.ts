import { Injectable, signal } from '@angular/core';

/** 1 real second = 1 game minute → 60× */
const GAME_TIME_MULTIPLIER = 60;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * App-wide game clock. Runs a single 1-second interval for the whole app so the HUD time
 * stays consistent and keeps ticking as the player navigates between sections.
 */
@Injectable({ providedIn: 'root' })
export class GameClockService {
  readonly gameDate = signal<string>('');
  readonly gameTime = signal<string>('');
  readonly isNight = signal<boolean>(false);

  constructor() {
    this.tick();
    setInterval(() => this.tick(), 1000);
  }

  private tick() {
    const gameDate = new Date(Date.now() * GAME_TIME_MULTIPLIER);

    const hour = gameDate.getUTCHours();
    this.isNight.set(hour >= 18 || hour < 6);

    const mins = gameDate.getUTCMinutes().toString().padStart(2, '0');
    const displayHour = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    this.gameTime.set(`${displayHour}:${mins} ${ampm}`);

    const day = gameDate.getUTCDate();
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    this.gameDate.set(`${day}${suffix} ${MONTHS[gameDate.getUTCMonth()]} ${gameDate.getUTCFullYear()}`);
  }
}
