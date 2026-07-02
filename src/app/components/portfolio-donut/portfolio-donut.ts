import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface Arc extends DonutSegment {
  dashArray: string;
  dashOffset: number;
  pct: number;
}

/**
 * Allocation donut: renders net-worth composition (cash, holdings, company equity, …) as a
 * ring of colored arcs with a center total. Bespoke SVG — no charting dependency.
 */
@Component({
  selector: 'app-portfolio-donut',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio-donut.html',
  styleUrl: './portfolio-donut.css',
})
export class PortfolioDonut {
  segments = input<DonutSegment[]>([]);
  centerLabel = input<string>('Net Worth');

  readonly R = 42; // radius
  readonly C = 2 * Math.PI * 42; // circumference

  private visible = computed(() => this.segments().filter((s) => s.value > 0));

  total = computed(() => this.visible().reduce((sum, s) => sum + s.value, 0));

  arcs = computed<Arc[]>(() => {
    const total = this.total();
    if (total <= 0) return [];
    let offset = 0;
    return this.visible().map((s) => {
      const pct = s.value / total;
      const len = pct * this.C;
      const arc: Arc = {
        ...s,
        pct: pct * 100,
        dashArray: `${len.toFixed(2)} ${(this.C - len).toFixed(2)}`,
        dashOffset: -offset,
      };
      offset += len;
      return arc;
    });
  });

  /** Only arcs big enough to be visible get drawn on the ring (tiny ones show a stray cap dot). */
  ringArcs = computed<Arc[]>(() => this.arcs().filter((a) => a.pct >= 0.5));

  /** Compact center label so large net-worth values fit inside the ring (e.g. 1.00B). */
  totalCompact = computed<string>(() => this.compact(this.total()));

  private compact(v: number): string {
    // Lowercase magnitude suffixes to avoid colliding with "B" (Branks).
    const abs = Math.abs(v);
    if (abs >= 1e12) return (v / 1e12).toFixed(2) + 't';
    if (abs >= 1e9) return (v / 1e9).toFixed(2) + 'bn';
    if (abs >= 1e6) return (v / 1e6).toFixed(2) + 'm';
    if (abs >= 1e3) return (v / 1e3).toFixed(1) + 'k';
    return Math.round(v).toString();
  }

  /** Legend percent: avoid a misleading "0%" for tiny-but-nonzero slices. */
  fmtPct(pct: number): string {
    if (pct > 0 && pct < 1) return '<1%';
    return Math.round(pct) + '%';
  }
}
