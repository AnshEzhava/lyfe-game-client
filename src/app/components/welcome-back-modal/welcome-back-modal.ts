import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhileAwaySummary } from '../../types/api/user.types';

@Component({
  selector: 'app-welcome-back-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome-back-modal.html',
  styleUrl: './welcome-back-modal.css',
})
export class WelcomeBackModal {
  @Input() summary: WhileAwaySummary | null = null;
  @Output() closed = new EventEmitter<void>();

  onClose() {
    this.closed.emit();
  }
}
