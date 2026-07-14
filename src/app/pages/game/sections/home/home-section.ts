import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PixelIcon } from '../../../../components/pixel-icon/pixel-icon';
import { PIXEL_MAPS } from '../../../../data/pixel-maps';

interface Place {
  path: string;
  label: string;
  tag: string;
  color: string;
  map: string[];
  x: number;
  y: number;
}

interface Star {
  x: number;
  y: number;
  delay: string;
}

interface Coin {
  x: number;
  y: number;
  delay: string;
}

/**
 * The base "map" hub (pixel-arcade): scattered location cards the player travels to, each
 * routing to a section. Decorated with a marching path, twinkling stars and floating coins.
 */
@Component({
  selector: 'app-home-section',
  standalone: true,
  imports: [CommonModule, RouterLink, PixelIcon],
  templateUrl: './home-section.html',
  styleUrl: './home-section.css',
})
export class HomeSection {
  readonly starMap = PIXEL_MAPS['star'];
  readonly coinMap = PIXEL_MAPS['coin'];

  readonly places: Place[] = [
    { path: 'world', label: 'World', tag: 'Fly anywhere', color: 'var(--accent-green)', map: PIXEL_MAPS['world'], x: 56, y: 20 },
    { path: 'casino', label: 'Casino', tag: 'Feeling lucky?', color: 'var(--accent-coral)', map: PIXEL_MAPS['casino'], x: 25, y: 34 },
    { path: 'career', label: 'Career', tag: 'Get to work', color: 'var(--accent-sun)', map: PIXEL_MAPS['career'], x: 76, y: 46 },
    { path: 'market', label: 'Market', tag: 'Buy the dip', color: 'var(--accent-grape)', map: PIXEL_MAPS['market'], x: 48, y: 54 },
    { path: 'activity', label: 'Activity', tag: 'Stay alive', color: 'var(--accent-sky)', map: PIXEL_MAPS['activity'], x: 20, y: 66 },
    { path: 'news', label: 'News', tag: "Today's scoop", color: 'var(--accent-tangerine)', map: PIXEL_MAPS['news'], x: 43, y: 80 },
  ];

  readonly stars: Star[] = [
    { x: 38, y: 30, delay: '0s' },
    { x: 68, y: 62, delay: '.5s' },
    { x: 88, y: 38, delay: '1s' },
    { x: 33, y: 82, delay: '1.5s' },
    { x: 60, y: 86, delay: '.9s' },
    { x: 10, y: 30, delay: '.3s' },
  ];

  readonly coins: Coin[] = [
    { x: 80, y: 24, delay: '0s' },
    { x: 13, y: 50, delay: '.6s' },
    { x: 66, y: 74, delay: '1.1s' },
  ];
}
