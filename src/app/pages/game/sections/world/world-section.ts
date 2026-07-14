import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Flagship placeholder for the future world map: buying plots/spaces and other location-based
 * systems will live here. Kept as its own route so it can grow into the hub.
 */
@Component({
  selector: 'app-world-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './world-section.html',
  styleUrl: './world-section.css',
})
export class WorldSection {}
