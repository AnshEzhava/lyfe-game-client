import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CasinoGameBase } from './casino-game.base';
import { BetControls } from './bet-controls';
import { CasinoGame, CasinoPlayResponse } from '../../../../../types/api/casino.types';

@Component({
  selector: 'app-coinflip-game',
  standalone: true,
  imports: [CommonModule, RouterLink, BetControls],
  templateUrl: './coinflip-game.html',
  styleUrls: ['./casino-game.css', './coinflip-game.css'],
})
export class CoinflipGame extends CasinoGameBase {
  protected readonly game: CasinoGame = 'COINFLIP';

  readonly pick = signal<'HEADS' | 'TAILS'>('HEADS');
  readonly landed = signal<'HEADS' | 'TAILS'>('HEADS');
  readonly flipping = signal(false);

  protected override choice(): string {
    return this.pick();
  }

  protected override async animate(res: CasinoPlayResponse): Promise<void> {
    this.flipping.set(true);
    await this.wait(1000);
    this.landed.set(res.outcome === 'TAILS' ? 'TAILS' : 'HEADS');
    this.flipping.set(false);
  }
}
