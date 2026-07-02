export interface UserResponse {
  id: string;
  displayName: string;
  balance: number;
  stats?: {
    intelligence: number;
  };
  netWorth?: number;
  totalTaxPaid?: number;
}

// ─── AFK / offline-loop types ───────────────────────────────────────────────

export interface NewsHighlight {
  headline: string;
  ticker: string | null;
  impactPct: number;
}

export interface WhileAwaySummary {
  responseCode: number;
  responseMessage: string;
  hasSummary: boolean;
  gameDaysAway: number;
  wagesEarned: number;
  bondYield: number;
  taxPaid: number;
  netWorthChange: number;
  autoClaimed: boolean;
  autoReinvested: number;
  newsHighlights: NewsHighlight[];
  courseReady: string | null;
  user: UserResponse | null;
}

export interface UserSettings {
  autoClaimWages: boolean;
  autoReinvest: boolean;
}

export interface SettingsResponse extends UserSettings {
  responseCode: number;
  responseMessage: string;
}

export interface ActivityEvent {
  type: string;
  at: number;
  amount: number;
  label: string;
}

export interface ActivityResponse {
  responseCode: number;
  responseMessage: string;
  events: ActivityEvent[];
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
