import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClerkService } from 'ngx-clerk';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from '../../../../services/user.service';
import { Modal } from '../../../../components/modal/modal';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [Modal],
  templateUrl: './play.html',
  styleUrl: './play.css',
})
export class Play implements OnInit {
  private clerkService = inject(ClerkService);
  private router = inject(Router);
  private userService = inject(UserService);

  user = toSignal(this.clerkService.user$);
  healthStatus = signal<string>('Checking...');
  showModal = signal(false);
  balance = signal<number>(0);

  currentDate = signal<string>('');
  currentTime = signal<string>('');
  isNight = signal<boolean>(false);

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
    this.getBalance();
  }

  checkUser() {
    this.userService.findUser().subscribe({
      next: (res) => {
        this.healthStatus.set(`✅ User Found: ${JSON.stringify(res)}`);
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

  getBalance() {
    this.userService.getBalance().subscribe({
      next: (res) => {
        this.balance.set(res.balance);
      },
      error: (err) => {
        alert('Failed to get balance: ' + err.statusText);
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
