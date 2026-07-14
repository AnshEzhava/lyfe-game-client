import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Game } from './pages/game/game';
import { Auth } from './pages/game/subpages/auth/auth';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'home', component: Home },
  {
    path: 'game',
    component: Game,
    children: [
      { path: 'auth', component: Auth },
      {
        path: 'play',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/game/play-shell/play-shell').then((m) => m.PlayShell),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/game/sections/home/home-section').then((m) => m.HomeSection),
          },
          {
            path: 'market',
            loadComponent: () =>
              import('./pages/game/sections/market/market-section').then((m) => m.MarketSection),
          },
          {
            path: 'career',
            loadComponent: () =>
              import('./pages/game/sections/career/career-section').then((m) => m.CareerSection),
          },
          {
            path: 'news',
            loadComponent: () =>
              import('./pages/game/sections/news/news-section').then((m) => m.NewsSection),
          },
          {
            path: 'casino',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/game/sections/casino/casino-lobby').then((m) => m.CasinoLobby),
              },
              {
                path: 'slots',
                loadComponent: () =>
                  import('./pages/game/sections/casino/games/slots-game').then((m) => m.SlotsGame),
              },
              {
                path: 'coinflip',
                loadComponent: () =>
                  import('./pages/game/sections/casino/games/coinflip-game').then((m) => m.CoinflipGame),
              },
              {
                path: 'dice',
                loadComponent: () =>
                  import('./pages/game/sections/casino/games/dice-game').then((m) => m.DiceGame),
              },
              {
                path: 'roulette',
                loadComponent: () =>
                  import('./pages/game/sections/casino/games/roulette-game').then((m) => m.RouletteGame),
              },
              {
                path: 'plinko',
                loadComponent: () =>
                  import('./pages/game/sections/casino/games/plinko-game').then((m) => m.PlinkoGame),
              },
            ],
          },
          {
            path: 'activity',
            loadComponent: () =>
              import('./pages/game/sections/activity/activity-section').then(
                (m) => m.ActivitySection,
              ),
          },
          {
            path: 'world',
            loadComponent: () =>
              import('./pages/game/sections/world/world-section').then((m) => m.WorldSection),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
