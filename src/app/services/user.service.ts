import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CONFIG } from '../config/environment';
import { ENDPOINTS } from '../config/endpoints';
import {
  ApiResponse,
  BalanceResponse,
  ClaimWageResponse,
  CreateUserRequest,
  EducationActionResponse,
  EducationStatusResponse,
  JobActionResponse,
  JobStatusResponse,
  UserResponse,
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

  getJobStatus(): Observable<JobStatusResponse> {
    return this.http.get<JobStatusResponse>(`${CONFIG.API_URL}${ENDPOINTS.GET_JOBS}`);
  }

  startJob(jobId: string): Observable<JobActionResponse> {
    return this.http.post<JobActionResponse>(`${CONFIG.API_URL}${ENDPOINTS.START_JOB}`, { jobId });
  }

  quitJob(): Observable<JobActionResponse> {
    return this.http.post<JobActionResponse>(`${CONFIG.API_URL}${ENDPOINTS.QUIT_JOB}`, {});
  }

  claimWage(): Observable<ClaimWageResponse> {
    return this.http.post<ClaimWageResponse>(`${CONFIG.API_URL}${ENDPOINTS.CLAIM_WAGE}`, {});
  }

  getEducationStatus(): Observable<EducationStatusResponse> {
    return this.http.get<EducationStatusResponse>(`${CONFIG.API_URL}${ENDPOINTS.GET_EDUCATION}`);
  }

  enrollCourse(courseId: string): Observable<EducationActionResponse> {
    return this.http.post<EducationActionResponse>(`${CONFIG.API_URL}${ENDPOINTS.ENROLL_COURSE}`, {
      courseId,
    });
  }

  completeCourse(): Observable<EducationActionResponse> {
    return this.http.post<EducationActionResponse>(
      `${CONFIG.API_URL}${ENDPOINTS.COMPLETE_COURSE}`,
      {},
    );
  }
}
