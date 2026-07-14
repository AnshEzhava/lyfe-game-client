import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../../../services/game-state.service';
import { NewsItem } from '../../../../types/api/news.types';

@Component({
  selector: 'app-news-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './news-section.html',
  styleUrl: './news-section.css',
})
export class NewsSection {
  private s = inject(GameStateService);

  heldStockIds = this.s.heldStockIds;
  formatImpact = this.s.formatImpact.bind(this.s);
  formatNewsTime = this.s.formatNewsTime.bind(this.s);

  // Local view state
  newsTab = signal<'your-news' | 'all'>('your-news');
  newsSearch = signal('');
  newsSort = signal<'time' | 'impact'>('time');

  filteredNews = computed<NewsItem[]>(() => {
    let items = [...this.s.newsItems()];

    if (this.newsTab() === 'your-news') {
      const stockIds = this.s.heldStockIds();
      const sectors = this.s.heldSectors();
      items = items.filter((n) => {
        if (n.targetType === 'COMPANY') return stockIds.has(n.targetId);
        if (n.targetType === 'SECTOR') return sectors.has(n.targetId);
        return false;
      });
    }

    const q = this.newsSearch().toLowerCase().trim();
    if (q) {
      items = items.filter(
        (n) =>
          n.headline.toLowerCase().includes(q) ||
          n.targetLabel.toLowerCase().includes(q) ||
          (n.ticker?.toLowerCase().includes(q) ?? false),
      );
    }

    if (this.newsSort() === 'impact') {
      items.sort((a, b) => Math.abs(b.impactPct) - Math.abs(a.impactPct));
    } else {
      items.sort((a, b) => b.publishedAt - a.publishedAt);
    }

    return items;
  });
}
