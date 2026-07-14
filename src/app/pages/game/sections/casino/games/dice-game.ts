import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CasinoGameBase } from './casino-game.base';
import { BetControls } from './bet-controls';
import { CasinoGame, CasinoPlayResponse } from '../../../../../types/api/casino.types';

@Component({
  selector: 'app-dice-game',
  standalone: true,
  imports: [CommonModule, RouterLink, BetControls],
  templateUrl: './dice-game.html',
  styleUrls: ['./casino-game.css', './dice-game.css'],
})
export class DiceGame extends CasinoGameBase {
  protected readonly game: CasinoGame = 'DICE';

  readonly options = ['HIGH', 'LOW', '1', '2', '3', '4', '5', '6'];
  readonly pick = signal<string>('HIGH');
  readonly face = signal<number>(5);
  readonly rolling = signal(false);

  protected override choice(): string {
    return this.pick();
  }

  label(opt: string): string {
    return opt === 'HIGH' ? 'High 4-6' : opt === 'LOW' ? 'Low 1-3' : opt;
  }

  protected override async animate(res: CasinoPlayResponse): Promise<void> {
    this.rolling.set(true);
    const roll = setInterval(() => this.face.set(1 + Math.floor(Math.random() * 6)), 90);
    await this.wait(800);
    clearInterval(roll);
    const landed = parseInt(res.outcome, 10);
    this.face.set(landed >= 1 && landed <= 6 ? landed : this.face());
    this.rolling.set(false);
  }
}
