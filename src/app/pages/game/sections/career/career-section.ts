import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../../services/game-state.service';

@Component({
  selector: 'app-career-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './career-section.html',
  styleUrl: './career-section.css',
})
export class CareerSection {
  private s = inject(GameStateService);

  activeJob = this.s.activeJob;
  availableJobs = this.s.availableJobs;
  pendingWages = this.s.pendingWages;
  activeCourse = this.s.activeCourse;
  availableCourses = this.s.availableCourses;
  courseRemainingMs = this.s.courseRemainingMs;
  formatCountdown = this.s.formatCountdown.bind(this.s);
  formatDuration = this.s.formatDuration.bind(this.s);
  startJob = this.s.startJob.bind(this.s);
  quitJob = this.s.quitJob.bind(this.s);
  claimWage = this.s.claimWage.bind(this.s);
  enrollCourse = this.s.enrollCourse.bind(this.s);
  completeCourse = this.s.completeCourse.bind(this.s);

  // Local view state
  jobTab = signal<'jobs' | 'education'>('jobs');
}
