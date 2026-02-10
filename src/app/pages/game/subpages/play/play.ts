import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ClerkService } from 'ngx-clerk';
import { toSignal } from '@angular/core/rxjs-interop';
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
  private http = inject(HttpClient);

  user = toSignal(this.clerkService.user$);
  healthStatus = signal<string>('Checking...');
  showModal = signal(false);

  constructor() {
    effect(() => {
      // If user is undefined (loading) or null (not signed in), handle accordingly
      // Here we blindly redirect if strictly null, but be careful with 'undefined' initial state
      if (this.user() === null) {
        this.router.navigate(['/game/auth']);
      }
    });
  }

  ngOnInit() {
    this.checkUser();
  }

  checkUser() {
    this.http.get('http://localhost:8080/api/user/find').subscribe({
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

  onModalSubmit(displayName: string) {
    this.http.post('http://localhost:8080/api/user/add', { displayName }).subscribe({
      next: (res) => {
        this.showModal.set(false);
        this.healthStatus.set('✅ User Created! Reloading...');
        this.checkUser(); // Reload user data
      },
      error: (err) => {
        alert('Failed to create user: ' + err.statusText);
      },
    });
  }
}
