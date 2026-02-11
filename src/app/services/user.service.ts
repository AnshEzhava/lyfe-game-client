import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CONFIG } from '../config/environment';
import { ENDPOINTS } from '../config/endpoints';
import { UserResponse, BalanceResponse, CreateUserRequest } from '../types/api/user.types';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);

  findUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${CONFIG.API_URL}${ENDPOINTS.FIND_USER}`);
  }

  getBalance(): Observable<BalanceResponse> {
    return this.http.get<BalanceResponse>(`${CONFIG.API_URL}${ENDPOINTS.GET_BALANCE}`);
  }

  createUser(displayName: string): Observable<UserResponse> {
    const payload: CreateUserRequest = { displayName };
    return this.http.post<UserResponse>(`${CONFIG.API_URL}${ENDPOINTS.ADD_USER}`, payload);
  }
}
