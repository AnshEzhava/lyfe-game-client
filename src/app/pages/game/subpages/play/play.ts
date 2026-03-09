import { Component, inject, signal, effect, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClerkService } from 'ngx-clerk';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from '../../../../services/user.service';
import { ToastService } from '../../../../services/toast.service';
import {
  ActiveCourseInfo,
  ActiveJobInfo,
  CourseInfo,
  EducationStatusResponse,
  JobInfo,
  JobStatusResponse,
  UserResponse,
} from '../../../../types/api/user.types';
import { Modal } from '../../../../components/modal/modal';

// 1 real second = 1 game minute → multiplier = 60
const GAME_TIME_MULTIPLIER = 60;

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [Modal, CommonModule],
  templateUrl: './play.html',
  styleUrl: './play.css',
})
export class Play implements OnInit, OnDestroy {
  private clerkService = inject(ClerkService);
  private router = inject(Router);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  user = toSignal(this.clerkService.user$);
  gameUser = signal<UserResponse | null>(null);
  showModal = signal(false);

  gameDate = signal<string>('');
  gameTime = signal<string>('');
  isNight = signal<boolean>(false);

  expandedSection = signal<string | null>(null);
  overlayVisible = signal(false);
  jobTab = signal<'jobs' | 'education'>('jobs');

  jobStatus = signal<JobStatusResponse | null>(null);
  activeJob = computed<ActiveJobInfo | null>(() => this.jobStatus()?.activeJob ?? null);
  availableJobs = computed<JobInfo[]>(() => this.jobStatus()?.availableJobs ?? []);
  pendingWages = signal<number>(0);

  educationStatus = signal<EducationStatusResponse | null>(null);
  activeCourse = computed<ActiveCourseInfo | null>(
    () => this.educationStatus()?.activeCourse ?? null,
  );
  availableCourses = computed<CourseInfo[]>(() => this.educationStatus()?.availableCourses ?? []);
  courseRemainingMs = signal<number>(0);

  intelligence = computed(() => this.gameUser()?.stats?.intelligence ?? 0);
  branks = computed(() => this.gameUser()?.balance ?? 0);

  private clockInterval: ReturnType<typeof setInterval> | null = null;
  private wageInterval: ReturnType<typeof setInterval> | null = null;
  private courseInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      if (this.user() === null) {
        this.router.navigate(['/game/auth']);
      }
    });
    this.startGameClock();
  }

  ngOnInit() {
    this.checkUser();
  }

  ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.wageInterval) clearInterval(this.wageInterval);
    if (this.courseInterval) clearInterval(this.courseInterval);
  }

  startGameClock() {
    const tick = () => {
      const realNow = Date.now();
      const gameMs = realNow * GAME_TIME_MULTIPLIER;
      const gameDate = new Date(gameMs);

      const hour = gameDate.getUTCHours();
      this.isNight.set(hour >= 18 || hour < 6);

      const mins = gameDate.getUTCMinutes().toString().padStart(2, '0');
      const displayHour = hour % 12 || 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      this.gameTime.set(`${displayHour}:${mins} ${ampm}`);

      const day = gameDate.getUTCDate();
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const month = monthNames[gameDate.getUTCMonth()];
      const year = gameDate.getUTCFullYear();
      let suffix = 'th';
      if (day === 1 || day === 21 || day === 31) suffix = 'st';
      else if (day === 2 || day === 22) suffix = 'nd';
      else if (day === 3 || day === 23) suffix = 'rd';
      this.gameDate.set(`${day}${suffix} ${month} ${year}`);
    };

    tick();
    this.clockInterval = setInterval(tick, 1000);
  }

  private startWageTicker() {
    if (this.wageInterval) clearInterval(this.wageInterval);
    this.wageInterval = setInterval(() => {
      const job = this.activeJob();
      if (!job) {
        this.pendingWages.set(0);
        return;
      }
      // effectiveHourlyRate already accounts for intelligence (computed server-side).
      // branksPerRealSec = effectiveHourlyRate / 60  (1 game-hour = 60 real-seconds)
      const elapsedSec = (Date.now() - job.lastClaimedAt) / 1000;
      const branksPerSec = job.effectiveHourlyRate / 60;
      this.pendingWages.set(Math.floor(elapsedSec * branksPerSec));
    }, 1000);
  }

  private startCourseCountdown() {
    if (this.courseInterval) clearInterval(this.courseInterval);
    this.courseInterval = setInterval(() => {
      const course = this.activeCourse();
      if (!course || course.complete) {
        this.courseRemainingMs.set(0);
        return;
      }
      const remaining = Math.max(0, course.completesAt - Date.now());
      this.courseRemainingMs.set(remaining);
      // Auto-refresh once the timer hits zero
      if (remaining === 0) {
        this.refreshEducation();
      }
    }, 1000);
  }

  checkUser() {
    this.userService.findUser().subscribe({
      next: (res) => {
        this.gameUser.set(res);
        this.loadJobStatus();
        this.loadEducationStatus();
      },
      error: (err) => {
        if (err.status === 404) {
          this.showModal.set(true);
        }
      },
    });
  }

  onModalSubmit(displayName: string) {
    this.userService.createUser(displayName).subscribe({
      next: () => {
        this.showModal.set(false);
        this.checkUser();
      },
      error: (err) => {
        this.toast.show('Failed to create user: ' + (err.statusText ?? 'Unknown error'), 'error');
      },
    });
  }

  loadJobStatus() {
    this.userService.getJobStatus().subscribe({
      next: (res) => {
        this.jobStatus.set(res);
        if (res.activeJob) {
          this.pendingWages.set(res.activeJob.pendingWages);
          this.startWageTicker();
        }
      },
      error: () => {},
    });
  }

  startJob(jobId: string) {
    this.userService.startJob(jobId).subscribe({
      next: (res) => {
        if (res.user) this.gameUser.set(res.user);
        this.toast.show('Job started!');
        this.loadJobStatus();
      },
      error: (err) => {
        this.toast.show(err.error?.responseMessage ?? 'Could not start job.', 'error');
      },
    });
  }

  quitJob() {
    this.userService.quitJob().subscribe({
      next: (res) => {
        if (res.user) this.gameUser.set(res.user);
        this.toast.show('Job quit. Wages claimed.');
        if (this.wageInterval) clearInterval(this.wageInterval);
        this.pendingWages.set(0);
        this.loadJobStatus();
      },
      error: (err) => {
        this.toast.show(err.error?.responseMessage ?? 'Could not quit job.', 'error');
      },
    });
  }

  claimWage() {
    this.userService.claimWage().subscribe({
      next: (res) => {
        if (res.user) this.gameUser.set(res.user);
        this.toast.show(`Claimed ${res.wagesClaimed} Branks!`);
        // Stop ticker immediately so it doesn't overshoot while the status reloads
        if (this.wageInterval) {
          clearInterval(this.wageInterval);
          this.wageInterval = null;
        }
        this.pendingWages.set(0);
        this.loadJobStatus();
      },
      error: (err) => {
        this.toast.show(err.error?.responseMessage ?? 'Could not claim wages.', 'error');
      },
    });
  }

  loadEducationStatus() {
    this.userService.getEducationStatus().subscribe({
      next: (res) => {
        this.educationStatus.set(res);
        if (res.activeCourse && !res.activeCourse.complete) {
          this.courseRemainingMs.set(res.activeCourse.remainingMs);
          this.startCourseCountdown();
        }
      },
      error: () => {},
    });
  }

  refreshEducation() {
    this.userService.getEducationStatus().subscribe({
      next: (res) => this.educationStatus.set(res),
      error: () => {},
    });
  }

  enrollCourse(courseId: string) {
    this.userService.enrollCourse(courseId).subscribe({
      next: (res) => {
        if (res.user) this.gameUser.set(res.user);
        this.toast.show('Enrolled! Study hard.');
        this.loadEducationStatus();
        this.loadJobStatus();
      },
      error: (err) => {
        this.toast.show(err.error?.responseMessage ?? 'Could not enroll.', 'error');
      },
    });
  }

  completeCourse() {
    this.userService.completeCourse().subscribe({
      next: (res) => {
        if (res.user) this.gameUser.set(res.user);
        this.toast.show('Course complete! Intelligence increased.');
        if (this.courseInterval) clearInterval(this.courseInterval);
        this.courseRemainingMs.set(0);
        this.loadEducationStatus();
      },
      error: (err) => {
        this.toast.show(err.error?.responseMessage ?? 'Could not complete course.', 'error');
      },
    });
  }

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  expand(section: string) {
    // Cancel any pending close cleanup
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.expandedSection.set(section);
    // Allow the DOM to render hidden overlay, then trigger transition
    requestAnimationFrame(() => {
      this.overlayVisible.set(true);
    });
  }

  close(event?: Event) {
    if (event) event.stopPropagation();
    // Start the CSS exit transition
    this.overlayVisible.set(false);
    // After transition ends, remove content from DOM
    this.closeTimer = setTimeout(() => {
      this.expandedSection.set(null);
      this.closeTimer = null;
    }, 350);
  }

  formatCountdown(ms: number): string {
    if (ms <= 0) return 'Complete!';
    const totalSeconds = Math.floor(ms / 1000);
    // 1 real second = 1 game minute
    const gameMinutes = totalSeconds;
    const gameDays = Math.floor(gameMinutes / (24 * 60));
    const gameHours = Math.floor((gameMinutes % (24 * 60)) / 60);
    const mins = gameMinutes % 60;
    const parts: string[] = [];
    if (gameDays > 0) parts.push(`${gameDays}d`);
    if (gameHours > 0) parts.push(`${gameHours}h`);
    parts.push(`${mins}m`);
    return parts.join(' ');
  }

  formatDuration(seconds: number): string {
    const gameMinutes = seconds; // 1 real second = 1 game minute
    const gameDays = Math.floor(gameMinutes / (24 * 60));
    const gameHours = Math.floor((gameMinutes % (24 * 60)) / 60);
    const mins = gameMinutes % 60;
    const parts: string[] = [];
    if (gameDays > 0) parts.push(`${gameDays}d`);
    if (gameHours > 0) parts.push(`${gameHours}h`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
    return parts.join(' ');
  }
}
