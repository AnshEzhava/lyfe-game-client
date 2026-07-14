import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CasinoGameBase } from './casino-game.base';
import { BetControls } from './bet-controls';
import { CasinoGame, CasinoPlayResponse } from '../../../../../types/api/casino.types';

/** European wheel pocket order (clockwise from 0). 37 pockets. */
const WHEEL_SEQUENCE = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const INDEX_OF = new Map(WHEEL_SEQUENCE.map((n, i) => [n, i]));
const STEP = 360 / WHEEL_SEQUENCE.length;

function colorOf(n: number): 'RED' | 'BLACK' | 'GREEN' {
  return n === 0 ? 'GREEN' : RED_NUMBERS.has(n) ? 'RED' : 'BLACK';
}

/** Polar (deg, 0 = top, clockwise) to SVG cartesian on a 200x200 canvas centred at 100,100. */
function polar(deg: number, r: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad) };
}

interface Pocket {
  n: number;
  color: string;
  path: string; // wedge
  lx: number;
  ly: number;
  rot: number; // label rotation
}

/** Precompute the 37 wedges + label transforms once. */
const POCKETS: Pocket[] = WHEEL_SEQUENCE.map((n, i) => {
  const a0 = i * STEP - STEP / 2;
  const a1 = i * STEP + STEP / 2;
  const oR = 98;
  const iR = 60;
  const p0o = polar(a0, oR);
  const p1o = polar(a1, oR);
  const p1i = polar(a1, iR);
  const p0i = polar(a0, iR);
  const path =
    `M ${p0o.x} ${p0o.y} A ${oR} ${oR} 0 0 1 ${p1o.x} ${p1o.y} ` +
    `L ${p1i.x} ${p1i.y} A ${iR} ${iR} 0 0 0 ${p0i.x} ${p0i.y} Z`;
  const label = polar(i * STEP, (oR + iR) / 2);
  return { n, color: colorOf(n) === 'RED' ? 'var(--rl-red)' : colorOf(n) === 'GREEN' ? 'var(--rl-green)' : 'var(--rl-black)', path, lx: label.x, ly: label.y, rot: i * STEP };
});

interface Cell {
  key: string; // server choice string
  label: string;
  color: string;
  col: number;
  row: number;
}

@Component({
  selector: 'app-roulette-game',
  standalone: true,
  imports: [CommonModule, RouterLink, BetControls],
  templateUrl: './roulette-game.html',
  styleUrls: ['./casino-game.css', './roulette-game.css'],
})
export class RouletteGame extends CasinoGameBase {
  protected readonly game: CasinoGame = 'ROULETTE';

  readonly pockets = POCKETS;

  /** Number cells 1-36, placed on the grid (12 columns x 3 rows, 0 sits to the left). */
  readonly numberCells: Cell[] = Array.from({ length: 36 }, (_, k) => {
    const n = k + 1;
    return {
      key: String(n),
      label: String(n),
      color: RED_NUMBERS.has(n) ? 'red' : 'black',
      col: Math.ceil(n / 3) + 1, // +1: column 1 is the 0 cell
      row: n % 3 === 0 ? 1 : n % 3 === 2 ? 2 : 3,
    };
  });

  readonly wheelAngle = signal(0);
  readonly spinning = signal(false);
  readonly winning = signal<number | null>(null);
  readonly winningColor = signal<string>('');
  /** Last spins, newest first, for the history strip. */
  readonly history = signal<{ n: number; color: string }[]>([]);

  /** The currently selected bet — its key is exactly the server `choice` string. */
  readonly selected = signal<string>('RED');
  readonly selectedLabel = computed(() => this.labelFor(this.selected()));

  readonly centerBg = computed(() => {
    switch (this.winningColor()) {
      case 'RED': return 'var(--rl-red)';
      case 'GREEN': return 'var(--rl-green)';
      case 'BLACK': return 'var(--rl-black)';
      default: return 'var(--surface-1)';
    }
  });

  chipColor(c: string): string {
    return c === 'RED' ? 'var(--rl-red)' : c === 'GREEN' ? 'var(--rl-green)' : 'var(--rl-black)';
  }

  select(key: string) {
    if (this.busy()) return;
    this.selected.set(key);
  }

  isSel(key: string): boolean {
    return this.selected() === key;
  }

  protected override choice(): string {
    return this.selected();
  }

  private labelFor(key: string): string {
    const map: Record<string, string> = {
      RED: 'Red', BLACK: 'Black', ODD: 'Odd', EVEN: 'Even', LOW: '1–18', HIGH: '19–36',
      DOZEN1: '1st 12', DOZEN2: '2nd 12', DOZEN3: '3rd 12', COL1: 'Column 1', COL2: 'Column 2', COL3: 'Column 3',
    };
    return map[key] ?? `Number ${key}`;
  }

  protected override async animate(res: CasinoPlayResponse): Promise<void> {
    this.spinning.set(true);
    this.winning.set(null);
    const n = parseInt(res.outcome, 10) || 0;
    const idx = INDEX_OF.get(n) ?? 0;

    // Rotate the wheel clockwise (≥5 turns) so pocket `idx` settles under the fixed top pointer.
    const desiredMod = ((-idx * STEP) % 360 + 360) % 360;
    const curMod = ((this.wheelAngle() % 360) + 360) % 360;
    let delta = desiredMod - curMod;
    if (delta > 0) delta -= 360;
    this.wheelAngle.set(this.wheelAngle() + delta - 360 * 5);

    await this.wait(3000); // matches the CSS transition
    this.winning.set(n);
    this.winningColor.set(res.reels[0] || colorOf(n));
    this.history.update((h) => [{ n, color: res.reels[0] || colorOf(n) }, ...h].slice(0, 12));
    this.spinning.set(false);
  }
}
