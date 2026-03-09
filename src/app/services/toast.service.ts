import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'success', duration = 3500): void {
    const id = Date.now() + Math.random(); // avoid collisions on rapid calls
    this.toasts.update((list) => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
