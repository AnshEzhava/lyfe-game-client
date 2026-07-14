import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { CONFIG } from '../config/environment';
import { ENDPOINTS } from '../config/endpoints';
import { CasinoPlayRequest, CasinoPlayResponse } from '../types/api/casino.types';
import { GameStateService } from './game-state.service';

@Injectable({ providedIn: 'root' })
export class CasinoService {
  private http = inject(HttpClient);
  private state = inject(GameStateService);

  play(req: CasinoPlayRequest): Observable<CasinoPlayResponse> {
    return this.http.post<CasinoPlayResponse>(`${CONFIG.API_URL}${ENDPOINTS.CASINO_PLAY}`, req);
  }

  /**
   * Play a round and fold the returned balance back into game state. Every game page just awaits
   * this, then drives its CSS animation from the response — no per-game subscribe/update wiring.
   */
  async playGame(req: CasinoPlayRequest): Promise<CasinoPlayResponse> {
    const res = await firstValueFrom(this.play(req));
    this.state.applyUserUpdate(res.user);
    return res;
  }
}
