import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../../../services/game-state.service';
import { IPOCreateRequest, Sector, SECTOR_OPTIONS, StockInfo } from '../../../../types/api/stock.types';
import { UserResponse } from '../../../../types/api/user.types';
import { ToastService } from '../../../../services/toast.service';
import { StockSparkline } from '../../../../components/stock-sparkline/stock-sparkline';
import { PortfolioDonut } from '../../../../components/portfolio-donut/portfolio-donut';
import { StockTradeModal } from '../../../../components/stock-trade-modal/stock-trade-modal';

@Component({
  selector: 'app-market-section',
  standalone: true,
  imports: [CommonModule, FormsModule, StockSparkline, PortfolioDonut, StockTradeModal],
  templateUrl: './market-section.html',
  styleUrl: './market-section.css',
})
export class MarketSection {
  private s = inject(GameStateService);
  private toast = inject(ToastService);

  // Re-exposed store state (references + bound methods) so the template reads naturally.
  stockQuotes = this.s.stockQuotes;
  portfolio = this.s.portfolio;
  pendingOrders = this.s.pendingOrders;
  netWorth = this.s.netWorth;
  branks = this.s.branks;
  gameUser = this.s.gameUser;
  myCompany = this.s.myCompany;
  hasOwnIPO = this.s.hasOwnIPO;
  portfolioSegments = this.s.portfolioSegments;
  formatPrice = this.s.formatPrice.bind(this.s);
  formatPriceChange = this.s.formatPriceChange.bind(this.s);
  getChartScheme = this.s.getChartScheme.bind(this.s);
  getHoldingForStock = this.s.getHoldingForStock.bind(this.s);
  getStockHistory = this.s.getStockHistory.bind(this.s);
  getTickerForStockId = this.s.getTickerForStockId.bind(this.s);
  loadPendingOrders = this.s.loadPendingOrders.bind(this.s);
  cancelOrder = this.s.cancelOrder.bind(this.s);

  // Local view state
  readonly SECTOR_OPTIONS = SECTOR_OPTIONS;
  stockTab = signal<'market' | 'portfolio' | 'mycompany' | 'orders'>('market');
  selectedStock = signal<StockInfo | null>(null);
  tradeModalOpen = signal(false);
  diluteQty = signal<number>(0);
  ipoForm = signal({
    name: '',
    ticker: '',
    sector: 'IT' as Sector,
    totalSupply: 100000,
    initialPricePerShare: 10,
    publicFloatPct: 30,
  });

  /** Highest price in a sparkline history (falls back to 0 for empty series). */
  chartHigh(prices: number[] | null | undefined): number {
    return prices && prices.length ? Math.max(...prices) : 0;
  }

  /** Lowest price in a sparkline history (falls back to 0 for empty series). */
  chartLow(prices: number[] | null | undefined): number {
    return prices && prices.length ? Math.min(...prices) : 0;
  }

  openTradeModal(stock: StockInfo) {
    this.selectedStock.set(stock);
    this.tradeModalOpen.set(true);
  }

  onTradeComplete(updatedUser: UserResponse) {
    this.s.onTradeComplete(updatedUser);
    this.tradeModalOpen.set(false);
    this.selectedStock.set(null);
  }

  dilute() {
    const qty = this.diluteQty();
    this.s.dilute(qty);
    if (qty > 0) this.diluteQty.set(0);
  }

  submitIPO() {
    const form = this.ipoForm();
    if (!form.name || !form.ticker) {
      this.toast.show('Name and ticker are required.', 'error');
      return;
    }
    const req: IPOCreateRequest = {
      name: form.name,
      ticker: form.ticker.toUpperCase(),
      sector: form.sector,
      totalSupply: form.totalSupply,
      initialPricePerShare: form.initialPricePerShare,
      publicFloatPct: form.publicFloatPct,
    };
    this.s.submitIPO(req);
  }

  setIpoName(v: string) { this.ipoForm.update((f) => ({ ...f, name: v })); }
  setIpoTicker(v: string) { this.ipoForm.update((f) => ({ ...f, ticker: v.toUpperCase() })); }
  setIpoSector(v: Sector) { this.ipoForm.update((f) => ({ ...f, sector: v })); }
  setIpoTotalSupply(v: number) { this.ipoForm.update((f) => ({ ...f, totalSupply: v })); }
  setIpoInitialPrice(v: number) { this.ipoForm.update((f) => ({ ...f, initialPricePerShare: v })); }
  setIpoPublicFloat(v: number) { this.ipoForm.update((f) => ({ ...f, publicFloatPct: v })); }
}
