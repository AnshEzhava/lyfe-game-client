import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Game } from './pages/game/game';
import { Auth } from './pages/game/subpages/auth/auth';
import { Play } from './pages/game/subpages/play/play';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'home', component: Home },
  {
    path: 'game',
    component: Game,
    children: [
      { path: 'auth', component: Auth },
      { path: 'play', component: Play },
    ],
  },
  { path: '**', redirectTo: '' },
];
