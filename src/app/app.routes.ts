import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { SnakeGame } from './pages/snake-game/snake-game';
import { SpaceInvader } from './pages/space-invader/space-invader';
import { TicTacToe } from './pages/tic-tac-toe/tic-tac-toe';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'tic-tac-toe',
    component: TicTacToe,
  },
  {
    path: 'snake-game',
    component: SnakeGame,
  },
  {
    path: 'space-invader',
    component: SpaceInvader,
  },
];
