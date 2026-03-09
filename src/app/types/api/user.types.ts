export interface UserResponse {
  id: string;
  displayName: string;
  balance: number;
  stats?: {
    intelligence: number;
  };
}

export interface BalanceResponse {
  balance: number;
}

export interface CreateUserRequest {
  displayName: string;
}

export interface ApiResponse<T> {
  responseCode: number;
  responseMessage: string;
  response: T;
}

export interface JobInfo {
  id: string;
  name: string;
  description: string;
  baseHourlyRate: number;
  minIntelligence: number;
  partTime: boolean;
  effectiveHourlyRate: number;
  eligible: boolean;
}

export interface ActiveJobInfo {
  jobId: string;
  jobName: string;
  startedAt: number;
  lastClaimedAt: number;
  pendingWages: number;
  effectiveHourlyRate: number;
}

export interface JobStatusResponse {
  responseCode: number;
  responseMessage: string;
  activeJob: ActiveJobInfo | null;
  availableJobs: JobInfo[];
}

export interface JobActionResponse {
  responseCode: number;
  responseMessage: string;
  user: UserResponse | null;
}

export interface ClaimWageResponse {
  responseCode: number;
  responseMessage: string;
  wagesClaimed: number;
  user: UserResponse | null;
}

export interface CourseInfo {
  id: string;
  name: string;
  description: string;
  cost: number;
  durationSeconds: number;
  intelligenceReward: number;
  minIntelligence: number;
  eligible: boolean;
}

export interface ActiveCourseInfo {
  courseId: string;
  courseName: string;
  enrolledAt: number;
  completesAt: number;
  remainingMs: number;
  complete: boolean;
  rewardClaimed: boolean;
  intelligenceReward: number;
}

export interface EducationStatusResponse {
  responseCode: number;
  responseMessage: string;
  activeCourse: ActiveCourseInfo | null;
  availableCourses: CourseInfo[];
}

export interface EducationActionResponse {
  responseCode: number;
  responseMessage: string;
  user: UserResponse | null;
}
