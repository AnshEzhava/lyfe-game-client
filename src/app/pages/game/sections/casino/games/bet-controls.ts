import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CasinoPlayResponse } from '../../../../../types/api/casino.types';

/**
 * Shared bet UI for every casino game: the win/loss outcome banner, the bet input + quick chips,
 * and the Play button. Presentational only — the game page owns the play logic and passes the
 * latest {@link CasinoPlayResponse} back in as `result` to show the banner.
 */
@Component({
  selector: 'app-bet-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bet-controls.html',
  styleUrl: './bet-controls.css',
})
export class BetControls {
  readonly balance = input<number>(0);
  readonly busy = input<boolean>(false);
  readonly result = input<CasinoPlayResponse | null>(null);
  readonly playLabel = input<string>('Play');

  /** Two-way: the current bet amount. */
  readonly bet = model<number>(100);

  readonly play = output<void>();

  readonly chips = [100, 1000, 10000];

  setChip(v: number) {
    this.bet.set(v);
  }
}
