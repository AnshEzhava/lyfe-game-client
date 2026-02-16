import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CONFIG } from '../config/environment';
import { ENDPOINTS } from '../config/endpoints';
import {
  UserResponse,
  BalanceResponse,
  CreateUserRequest,
  ApiResponse,
} from '../types/api/user.types';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);

  findUser(): Observable<UserResponse> {
    return this.http
      .get<ApiResponse<UserResponse>>(`${CONFIG.API_URL}${ENDPOINTS.FIND_USER}`)
      .pipe(map((res) => res.response));
  }

  getBalance(): Observable<BalanceResponse> {
    return this.http
      .get<ApiResponse<BalanceResponse>>(`${CONFIG.API_URL}${ENDPOINTS.GET_BALANCE}`)
      .pipe(map((res) => res.response));
  }

  createUser(displayName: string): Observable<UserResponse> {
    const payload: CreateUserRequest = { displayName };
    return this.http
      .post<ApiResponse<UserResponse>>(`${CONFIG.API_URL}${ENDPOINTS.ADD_USER}`, payload)
      .pipe(map((res) => res.response));
  }
}
