import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stock-sparkline',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host {
      display: flex;
      width: 100%;
      height: 100%;
      min-height: 0;
    }
    .sparkline-wrap {
      display: flex;
      width: 100%;
      height: 100%;
      gap: 4px;
      min-height: 0;
    }
    .sparkline-svg-area {
      flex: 1;
      min-width: 0;
      height: 100%;
    }
    .sparkline-svg-area svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .sparkline-y-labels {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 36px;
      flex-shrink: 0;
      padding: 1px 0;
    }
    .sparkline-y-label {
      font-family: 'poppins', sans-serif;
      font-size: 0.56rem;
      color: rgba(255, 255, 255, 0.38);
      text-align: right;
      line-height: 1;
      white-space: nowrap;
    }
  `],
  template: `
    <div class="sparkline-wrap">
      <div class="sparkline-svg-area">
        <svg [attr.viewBox]="'0 0 200 60'" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            [attr.d]="fillPath()"
            [attr.fill]="color()"
            fill-opacity="0.12"
            stroke="none"
          />
          <polyline
            [attr.points]="linePoints()"
            [attr.stroke]="color()"
            stroke-width="1.5"
            fill="none"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div class="sparkline-y-labels">
        <span class="sparkline-y-label">{{ maxLabel() }}</span>
        <span class="sparkline-y-label">{{ minLabel() }}</span>
      </div>
    </div>
  `,
})
export class StockSparkline {
  prices = input<number[]>([]);
  color = input<string>('var(--green)');

  private coords = computed<{ x: number; y: number }[]>(() => {
    const pts = this.prices();
    if (pts.length < 2) return [];
    const minP = Math.min(...pts);
    const maxP = Math.max(...pts);
    const range = maxP - minP || 1;
    return pts.map((p, i) => ({
      x: (i / (pts.length - 1)) * 200,
      y: 56 - ((p - minP) / range) * 52,
    }));
  });

  linePoints = computed<string>(() => {
    const cs = this.coords();
    if (cs.length < 2) return '0,30 200,30';
    return cs.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  });

  fillPath = computed<string>(() => {
    const cs = this.coords();
    if (cs.length < 2) return '';
    const line = cs.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' L ');
    const last = cs[cs.length - 1];
    const first = cs[0];
    return `M ${line} L ${last.x.toFixed(1)},60 L ${first.x.toFixed(1)},60 Z`;
  });

  private maxPrice = computed<number | null>(() => {
    const pts = this.prices();
    return pts.length >= 2 ? Math.max(...pts) : null;
  });

  private minPrice = computed<number | null>(() => {
    const pts = this.prices();
    return pts.length >= 2 ? Math.min(...pts) : null;
  });

  maxLabel = computed<string>(() => {
    const v = this.maxPrice();
    return v !== null ? this.formatVal(v) : '';
  });

  minLabel = computed<string>(() => {
    const v = this.minPrice();
    return v !== null ? this.formatVal(v) : '';
  });

  private formatVal(v: number): string {
    if (v >= 1000) return v.toFixed(0);
    if (v >= 10) return v.toFixed(1);
    return v.toFixed(2);
  }
}
