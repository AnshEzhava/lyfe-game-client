import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GameStateService } from '../../../../services/game-state.service';

interface CasinoGameCard {
  path: string;
  label: string;
  tag: string;
  art: string; // /casino/lobby/*.png
}

/**
 * Casino lobby: an illustrated grid of the games. Each card is the PixelLab hero sprite and links
 * to that game's own page (child route of `casino`). Reached from the Home map's Casino place.
 */
@Component({
  selector: 'app-casino-lobby',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './casino-lobby.html',
  styleUrl: './casino-lobby.css',
})
export class CasinoLobby {
  readonly state = inject(GameStateService);

  readonly games: CasinoGameCard[] = [
    { path: 'slots', label: 'Slots', tag: 'Match to win 25×', art: '/casino/lobby/slot-machine.png' },
    { path: 'roulette', label: 'Roulette', tag: 'Spin the wheel', art: '/casino/lobby/roulette.png' },
    { path: 'plinko', label: 'Plinko', tag: 'Drop the ball', art: '/casino/lobby/plinko.png' },
    { path: 'coinflip', label: 'Coin Flip', tag: 'Heads or tails', art: '/casino/lobby/coin.png' },
    { path: 'dice', label: 'Dice', tag: 'High, low or exact', art: '/casino/lobby/dice.png' },
  ];
}
