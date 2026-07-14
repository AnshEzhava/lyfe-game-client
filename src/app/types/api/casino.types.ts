import { UserResponse } from './user.types';

export type CasinoGame = 'SLOTS' | 'COINFLIP' | 'DICE' | 'ROULETTE' | 'PLINKO';

export interface CasinoPlayRequest {
  game: CasinoGame;
  bet: number;
  choice: string;
}

export interface CasinoPlayResponse {
  responseCode: number;
  responseMessage: string;
  game: string;
  win: boolean;
  bet: number;
  payout: number;
  netDelta: number;
  outcome: string;
  reels: string[];
  user: UserResponse | null;
}
