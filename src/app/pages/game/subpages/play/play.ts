import { Component, inject, signal, effect, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClerkService } from 'ngx-clerk';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from '../../../../services/user.service';
import { UserResponse } from '../../../../types/api/user.types';
import { Modal } from '../../../../components/modal/modal';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [Modal, CommonModule],
  templateUrl: './play.html',
  styleUrl: './play.css',
})
export class Play implements OnInit {
  private clerkService = inject(ClerkService);
  private router = inject(Router);
  private userService = inject(UserService);

  user = toSignal(this.clerkService.user$);
  gameUser = signal<UserResponse | null>(null);
  healthStatus = signal<string>('Checking...');
  showModal = signal(false);

  currentDate = signal<string>('');
  currentTime = signal<string>('');
  isNight = signal<boolean>(false);
  expandedSection = signal<string | null>(null);

  // Computed signal for intelligence
  intelligence = computed(() => this.gameUser()?.stats?.intelligence || 0);
  branks = computed(() => this.gameUser()?.balance || 0);

  expand(section: string) {
    if (!document.startViewTransition) {
      this.expandedSection.set(section);
      return;
    }
    document.startViewTransition(() => {
      this.expandedSection.set(section);
    });
  }

  close(event?: Event) {
    if (event) event.stopPropagation();
    if (!document.startViewTransition) {
      this.expandedSection.set(null);
      return;
    }
    document.startViewTransition(() => {
      this.expandedSection.set(null);
    });
  }

  constructor() {
    effect(() => {
      if (this.user() === null) {
        this.router.navigate(['/game/auth']);
      }
    });

    this.startClock();
  }

  startClock() {
    setInterval(() => {
      const now = new Date();
      this.currentTime.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      this.isNight.set(now.getHours() >= 18 || now.getHours() < 6);

      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      };
      const dateParts = now.toLocaleDateString('en-GB', options).split(' ');
      const day = parseInt(dateParts[0]);
      let suffix = 'th';
      if (day === 1 || day === 21 || day === 31) suffix = 'st';
      if (day === 2 || day === 22) suffix = 'nd';
      if (day === 3 || day === 23) suffix = 'rd';

      this.currentDate.set(`${day}${suffix} ${dateParts[1]} ${dateParts[2]}`);
    }, 1000);
  }

  ngOnInit() {
    this.checkUser();
  }

  checkUser() {
    this.userService.findUser().subscribe({
      next: (res) => {
        this.healthStatus.set(`✅ User Found: ${JSON.stringify(res)}`);
        this.gameUser.set(res);
      },
      error: (err) => {
        if (err.status === 404) {
          this.healthStatus.set('⚠️ User Not Found (New User)');
          this.showModal.set(true);
        } else {
          this.healthStatus.set(`❌ Error: ${err.status} ${err.statusText}`);
        }
      },
    });
  }

  onModalSubmit(displayName: string) {
    this.userService.createUser(displayName).subscribe({
      next: (res) => {
        this.showModal.set(false);
        this.healthStatus.set('✅ User Created! Reloading...');
        this.checkUser();
      },
      error: (err) => {
        alert('Failed to create user: ' + err.statusText);
      },
    });
  }
}
