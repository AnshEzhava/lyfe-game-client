import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Cell {
  col: number;
  row: number;
  bg: string;
}

/**
 * Renders a pixel-art icon from a grid map (mirrors the design's pix() helper).
 * '#' cells use `on`, 'o' cells use `alt`, everything else is empty.
 */
@Component({
  selector: 'app-pixel-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="pix"
      [style.grid-template-columns]="'repeat(' + cols() + ', ' + cell() + 'px)'"
      [style.grid-template-rows]="'repeat(' + rows() + ', ' + cell() + 'px)'"
    >
      <div
        *ngFor="let c of cells()"
        [style.grid-column]="c.col"
        [style.grid-row]="c.row"
        [style.background]="c.bg"
      ></div>
    </div>
  `,
  styles: [`.pix { display: grid; image-rendering: pixelated; }`],
})
export class PixelIcon {
  map = input<string[]>([]);
  cell = input<number>(5);
  on = input<string>('var(--text-primary)');
  alt = input<string>('var(--surface-1)');

  cols = computed(() => this.map()[0]?.length ?? 0);
  rows = computed(() => this.map().length);

  cells = computed<Cell[]>(() => {
    const out: Cell[] = [];
    const rows = this.map();
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        const bg = ch === '#' ? this.on() : ch === 'o' ? this.alt() : null;
        if (bg) out.push({ col: x + 1, row: y + 1, bg });
      }
    }
    return out;
  });
}
