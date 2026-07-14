import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../../services/game-state.service';

@Component({
  selector: 'app-activity-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-section.html',
  styleUrl: './activity-section.css',
})
export class ActivitySection {
  private s = inject(GameStateService);

  afkSettings = this.s.afkSettings;
  activityEvents = this.s.activityEvents;
  toggleAutoClaim = this.s.toggleAutoClaim.bind(this.s);
  toggleAutoReinvest = this.s.toggleAutoReinvest.bind(this.s);
  formatNewsTime = this.s.formatNewsTime.bind(this.s);
}
