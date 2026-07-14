import { inject, signal } from '@angular/core';
import { GameStateService } from '../../../../../services/game-state.service';
import { CasinoService } from '../../../../../services/casino.service';
import { ToastService } from '../../../../../services/toast.service';
import { CasinoGame, CasinoPlayResponse } from '../../../../../types/api/casino.types';

/**
 * Shared logic for every casino game page: validate the bet, call the server, run the game's own
 * animation, then reveal the outcome banner. Subclasses provide the game id, the current `choice`,
 * and an `animate()` hook that plays the CSS/sprite animation toward the returned result.
 */
export abstract class CasinoGameBase {
  protected readonly casino = inject(CasinoService);
  protected readonly toast = inject(ToastService);
  readonly state = inject(GameStateService);

  readonly bet = signal<number>(100);
  readonly busy = signal(false);
  readonly result = signal<CasinoPlayResponse | null>(null);

  /** Game identifier sent to the server. */
  protected abstract readonly game: CasinoGame;

  /** Game-specific pick (COINFLIP: HEADS/TAILS, DICE: HIGH/LOW/1-6, ...). Empty for Slots. */
  protected choice(): string {
    return '';
  }

  /** Play the game's animation toward the result; resolve when it has landed. */
  protected animate(_res: CasinoPlayResponse): Promise<void> | void {}

  async submit() {
    if (this.busy()) return;
    const bet = this.bet();
    if (!bet || bet <= 0) {
      this.toast.show('Enter a valid bet.', 'error');
      return;
    }
    if (bet > this.state.branks()) {
      this.toast.show('Not enough Branks for this bet.', 'error');
      return;
    }

    this.busy.set(true);
    this.result.set(null);
    try {
      const res = await this.casino.playGame({ game: this.game, bet, choice: this.choice() });
      await this.animate(res);
      this.result.set(res);
      this.toast.show(
        res.win ? `You won ${(res.payout - bet).toLocaleString()} Branks!` : `Lost ${bet.toLocaleString()} Branks.`,
        res.win ? 'success' : 'info',
      );
    } catch (e: any) {
      this.toast.show(e?.error?.responseMessage || 'Play failed. Try again.', 'error');
    } finally {
      this.busy.set(false);
    }
  }

  /** Small promise-based delay for staging animations. */
  protected wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
