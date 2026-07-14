import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CasinoGameBase } from './casino-game.base';
import { BetControls } from './bet-controls';
import { CasinoGame, CasinoPlayResponse } from '../../../../../types/api/casino.types';

type Risk = 'LOW' | 'MED' | 'HIGH';

const ROWS = 8;

// ponytail: mirrors CasinoService.PLINKO_* tables for bucket labels/highlight. If you retune the
// server edge, update these too (they're display-only; the server still decides the payout).
const TABLES: Record<Risk, number[]> = {
  LOW: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
  MED: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
  HIGH: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
};

@Component({
  selector: 'app-plinko-game',
  standalone: true,
  imports: [CommonModule, RouterLink, BetControls],
  templateUrl: './plinko-game.html',
  styleUrls: ['./casino-game.css', './plinko-game.css'],
})
export class PlinkoGame extends CasinoGameBase {
  protected readonly game: CasinoGame = 'PLINKO';

  readonly risks: Risk[] = ['LOW', 'MED', 'HIGH'];
  readonly risk = signal<Risk>('MED');
  readonly table = computed(() => TABLES[this.risk()]);

  readonly dropping = signal(false);
  readonly ballPos = signal(ROWS / 2); // 0..ROWS across the board
  readonly ballRow = signal(0);
  readonly landedBucket = signal<number | null>(null);

  protected override choice(): string {
    return this.risk();
  }

  /** Ball x% across the bucket area (8% padding each side). */
  readonly ballLeft = computed(() => 8 + (this.ballPos() / ROWS) * 84);
  readonly ballTop = computed(() => 4 + (this.ballRow() / ROWS) * 78);

  bucketLeft(i: number): number {
    return 8 + (i / ROWS) * 84;
  }

  protected override async animate(res: CasinoPlayResponse): Promise<void> {
    this.dropping.set(true);
    this.landedBucket.set(null);
    let pos = ROWS / 2;
    this.ballPos.set(pos);
    this.ballRow.set(0);
    const path = res.reels.slice(0, ROWS);
    for (let i = 0; i < path.length; i++) {
      await this.wait(130);
      pos += path[i] === 'R' ? 0.5 : -0.5;
      this.ballPos.set(pos);
      this.ballRow.set(i + 1);
    }
    this.landedBucket.set(path.filter((s) => s === 'R').length);
    await this.wait(150);
    this.dropping.set(false);
  }
}
