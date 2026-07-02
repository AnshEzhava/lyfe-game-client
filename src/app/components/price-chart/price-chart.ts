import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type Range = 'S' | 'M' | 'ALL';

/**
 * Interactive SVG price chart: soft area fill, axis labels, a hover crosshair + tooltip,
 * and a range toggle (Recent / Mid / All). Bespoke SVG — no charting dependency.
 * Coordinate math mirrors StockSparkline; this adds axes and interactivity.
 */
@Component({
  selector: 'app-price-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './price-chart.html',
  styleUrl: './price-chart.css',
})
export class PriceChart {
  prices = input<number[]>([]);
  color = input<string>('var(--green)');

  // Internal SVG coordinate space (rendered responsively via preserveAspectRatio="none").
  readonly W = 300;
  readonly H = 120;
  readonly PAD = 10;

  range = signal<Range>('ALL');
  hoverIdx = signal<number | null>(null);

  private windowSize: Record<Range, number> = { S: 20, M: 50, ALL: Infinity };

  points = computed<number[]>(() => {
    const all = this.prices() ?? [];
    const n = this.windowSize[this.range()];
    return n === Infinity ? all : all.slice(-n);
  });

  private minP = computed(() => (this.points().length ? Math.min(...this.points()) : 0));
  private maxP = computed(() => (this.points().length ? Math.max(...this.points()) : 0));

  coords = computed<{ x: number; y: number }[]>(() => {
    const pts = this.points();
    if (pts.length < 2) return [];
    const min = this.minP();
    const range = this.maxP() - min || 1;
    const inner = this.H - this.PAD * 2;
    return pts.map((p, i) => ({
      x: (i / (pts.length - 1)) * this.W,
      y: this.H - this.PAD - ((p - min) / range) * inner,
    }));
  });

  linePoints = computed<string>(() =>
    this.coords()
      .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(' '),
  );

  fillPath = computed<string>(() => {
    const cs = this.coords();
    if (cs.length < 2) return '';
    const line = cs.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' L ');
    return `M ${line} L ${cs[cs.length - 1].x.toFixed(1)},${this.H} L ${cs[0].x.toFixed(1)},${this.H} Z`;
  });

  // Y-axis labels (max / mid / min).
  maxLabel = computed(() => this.fmt(this.maxP()));
  midLabel = computed(() => this.fmt((this.maxP() + this.minP()) / 2));
  minLabel = computed(() => this.fmt(this.minP()));

  hoverPoint = computed(() => {
    const idx = this.hoverIdx();
    const cs = this.coords();
    if (idx === null || idx < 0 || idx >= cs.length) return null;
    return { ...cs[idx], value: this.points()[idx], leftPct: (cs[idx].x / this.W) * 100 };
  });

  isUp = computed(() => {
    const pts = this.points();
    return pts.length >= 2 ? pts[pts.length - 1] >= pts[0] : true;
  });

  setRange(r: Range) {
    this.range.set(r);
    this.hoverIdx.set(null);
  }

  onMove(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    const n = this.points().length;
    if (n < 2) return;
    const ratio = Math.min(1, Math.max(0, event.offsetX / el.clientWidth));
    this.hoverIdx.set(Math.round(ratio * (n - 1)));
  }

  clearHover() {
    this.hoverIdx.set(null);
  }

  private fmt(v: number): string {
    if (v >= 1000) return v.toFixed(0);
    if (v >= 10) return v.toFixed(1);
    return v.toFixed(2);
  }
}
