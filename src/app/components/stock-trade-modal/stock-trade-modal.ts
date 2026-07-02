import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { ToastService } from '../../services/toast.service';
import { StockInfo } from '../../types/api/stock.types';
import { UserResponse } from '../../types/api/user.types';
import { PriceChart } from '../price-chart/price-chart';

@Component({
  selector: 'app-stock-trade-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PriceChart],
  templateUrl: './stock-trade-modal.html',
  styleUrl: './stock-trade-modal.css',
})
export class StockTradeModal {
  @Input() stock: StockInfo | null = null;
  @Input() userBranks: number = 0;
  @Input() sharesOwned: number = 0;
  @Output() tradeComplete = new EventEmitter<UserResponse>();
  @Output() closed = new EventEmitter<void>();

  private stockService = inject(StockService);
  private toast = inject(ToastService);

  readonly Infinity = Infinity;

  tradeTab = signal<'BUY' | 'SELL'>('BUY');
  orderType = signal<'MARKET' | 'LIMIT'>('MARKET');
  quantity = signal<number>(1);
  limitPrice = signal<number>(0);
  isSubmitting = signal(false);

  estimatedCost = computed(() => {
    if (!this.stock || this.quantity() <= 0) return 0;
    const q = this.quantity();
    const b = this.stock.liquidityBranks;
    const s = this.stock.liquidityShares;
    if (this.tradeTab() === 'BUY') {
      if (q >= s) return Infinity;
      return Math.ceil((b * q) / (s - q));
    } else {
      return Math.floor((b * q) / (s + q));
    }
  });

  priceImpactPct = computed(() => {
    if (!this.stock || this.quantity() <= 0) return 0;
    const currentPrice = this.stock.currentPrice;
    const newPrice = this.estimatedNewPrice();
    if (currentPrice === 0) return 0;
    return ((newPrice - currentPrice) / currentPrice) * 100;
  });

  estimatedNewPrice = computed(() => {
    if (!this.stock || this.quantity() <= 0) return this.stock?.currentPrice ?? 0;
    const q = this.quantity();
    const b = this.stock.liquidityBranks;
    const s = this.stock.liquidityShares;
    if (this.tradeTab() === 'BUY') {
      const cost = Math.ceil((b * q) / (s - q));
      return (b + cost) / (s - q);
    } else {
      const ret = Math.floor((b * q) / (s + q));
      return (b - ret) / (s + q);
    }
  });

  get avgPrice(): number {
    if (this.quantity() <= 0) return 0;
    return this.estimatedCost() / this.quantity();
  }

  get canAfford(): boolean {
    if (this.tradeTab() === 'BUY') return this.userBranks >= this.estimatedCost();
    return this.sharesOwned >= this.quantity();
  }

  setTab(tab: 'BUY' | 'SELL') {
    this.tradeTab.set(tab);
    this.quantity.set(1);
  }

  setMax() {
    if (!this.stock) return;
    if (this.tradeTab() === 'BUY') {
      // Estimate max shares we can buy
      const b = this.stock.liquidityBranks;
      const s = this.stock.liquidityShares;
      const maxBranks = Math.min(this.userBranks, b * 0.1);
      // Invert AMM: q = S * maxBranks / (B + maxBranks)
      const maxQ = Math.floor((s * maxBranks) / (b + maxBranks));
      this.quantity.set(Math.max(1, maxQ));
    } else {
      this.quantity.set(Math.max(0, this.sharesOwned));
    }
  }

  submit() {
    if (!this.stock || this.isSubmitting()) return;
    if (this.quantity() <= 0) {
      this.toast.show('Enter a valid quantity.', 'error');
      return;
    }
    if (!this.canAfford) {
      this.toast.show(
        this.tradeTab() === 'BUY' ? 'Insufficient Branks.' : 'Insufficient shares.',
        'error',
      );
      return;
    }

    this.isSubmitting.set(true);

    if (this.orderType() === 'MARKET') {
      this.stockService
        .trade({ stockId: this.stock.id, action: this.tradeTab(), quantity: this.quantity() })
        .subscribe({
          next: (res) => {
            this.isSubmitting.set(false);
            if (res.responseCode !== 0) {
              this.toast.show(res.responseMessage, 'error');
              return;
            }
            const verb = this.tradeTab() === 'BUY' ? 'Bought' : 'Sold';
            this.toast.show(`${verb} ${res.sharesTransacted} shares of ${this.stock!.ticker}!`);
            if (res.user) this.tradeComplete.emit(res.user);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.toast.show(err.error?.responseMessage ?? 'Trade failed.', 'error');
          },
        });
    } else {
      this.stockService
        .placeLimitOrder({
          stockId: this.stock.id,
          action: this.tradeTab(),
          quantity: this.quantity(),
          limitPrice: this.limitPrice(),
        })
        .subscribe({
          next: (res) => {
            this.isSubmitting.set(false);
            if (res.responseCode !== 0) {
              this.toast.show(res.responseMessage, 'error');
              return;
            }
            this.toast.show(`Limit order placed for ${this.stock!.ticker}.`);
            this.closed.emit();
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.toast.show(err.error?.responseMessage ?? 'Order failed.', 'error');
          },
        });
    }
  }
}
