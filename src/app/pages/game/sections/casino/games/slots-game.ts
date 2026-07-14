import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CasinoGameBase } from './casino-game.base';
import { BetControls } from './bet-controls';
import { CasinoGame, CasinoPlayResponse } from '../../../../../types/api/casino.types';

const SYMBOLS = ['CHERRY', 'LEMON', 'BELL', 'BAR', 'STAR', 'SEVEN'];

@Component({
  selector: 'app-slots-game',
  standalone: true,
  imports: [CommonModule, RouterLink, BetControls],
  templateUrl: './slots-game.html',
  styleUrls: ['./casino-game.css', './slots-game.css'],
})
export class SlotsGame extends CasinoGameBase {
  protected readonly game: CasinoGame = 'SLOTS';

  /** The three reels' currently shown symbols. */
  readonly reels = signal<string[]>(['SEVEN', 'BAR', 'STAR']);
  readonly spinning = signal(false);

  art(symbol: string): string {
    return `/casino/slots/${symbol.toLowerCase()}.png`;
  }

  protected override async animate(res: CasinoPlayResponse): Promise<void> {
    this.spinning.set(true);
    // Cycle all reels fast, then lock them one at a time onto the server result.
    const spin = setInterval(() => {
      this.reels.set([rand(), rand(), rand()]);
    }, 80);
    await this.wait(700);
    clearInterval(spin);
    for (let i = 0; i < 3; i++) {
      this.reels.update((r) => {
        const next = [...r];
        next[i] = res.reels[i] ?? next[i];
        return next;
      });
      await this.wait(220);
    }
    this.spinning.set(false);
  }
}

function rand(): string {
  // index varies by call position; deterministic seed not needed for a visual shuffle
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}
