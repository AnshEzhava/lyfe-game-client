import { Component, inject, signal, effect, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClerkService } from 'ngx-clerk';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from '../../../../services/user.service';
import { StockService } from '../../../../services/stock.service';
import { ToastService } from '../../../../services/toast.service';
import {
  ActiveCourseInfo,
  ActiveJobInfo,
  CourseInfo,
  EducationStatusResponse,
  JobInfo,
  JobStatusResponse,
  UserResponse,
} from '../../../../types/api/user.types';
import {
  DiluteRequest,
  HoldingInfo,
  IPOCreateRequest,
  PendingOrder,
  PortfolioResponse,
  PriceTick,
  Sector,
  SECTOR_OPTIONS,
  StockInfo,
  StockQuoteResponse,
} from '../../../../types/api/stock.types';
import { Modal } from '../../../../components/modal/modal';
import { StockTradeModal } from '../../../../components/stock-trade-modal/stock-trade-modal';
import { StockSparkline } from '../../../../components/stock-sparkline/stock-sparkline';

// 1 real second = 1 game minute → multiplier = 60
const GAME_TIME_MULTIPLIER = 60;

const CHART_SCHEMES = [
  { stroke: '#4caf50', bg: 'rgba(76,175,80,0.07)',   border: 'rgba(76,175,80,0.28)'   },
  { stroke: '#3498db', bg: 'rgba(52,152,219,0.07)',  border: 'rgba(52,152,219,0.28)'  },
  { stroke: '#e67e22', bg: 'rgba(230,126,34,0.07)',  border: 'rgba(230,126,34,0.28)'  },
  { stroke: '#9b59b6', bg: 'rgba(155,89,182,0.07)',  border: 'rgba(155,89,182,0.28)'  },
  { stroke: '#1abc9c', bg: 'rgba(26,188,156,0.07)',  border: 'rgba(26,188,156,0.28)'  },
  { stroke: '#e74c3c', bg: 'rgba(231,76,60,0.07)',   border: 'rgba(231,76,60,0.28)'   },
  { stroke: '#f1c40f', bg: 'rgba(241,196,15,0.07)',  border: 'rgba(241,196,15,0.28)'  },
  { stroke: '#00bcd4', bg: 'rgba(0,188,212,0.07)',   border: 'rgba(0,188,212,0.28)'   },
];

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [Modal, CommonModule, FormsModule, StockTradeModal, StockSparkline],
  templateUrl: './play.html',
  styleUrl: './play.css',
})
export class Play implements OnInit, OnDestroy {
  private clerkService = inject(ClerkService);
  private router = inject(Router);
  private userService = inject(UserService);
  private stockService = inject(StockService);
  private toast = inject(ToastService);

  user = toSignal(this.clerkService.user$);
  gameUser = signal<UserResponse | null>(null);
  showModal = signal(false);

  gameDate = signal<string>('');
  gameTime = signal<string>('');
  isNight = signal<boolean>(false);

  expandedSection = signal<string | null>(null);
  overlayVisible = signal(false);
  jobTab = signal<'jobs' | 'education'>('jobs');

  jobStatus = signal<JobStatusResponse | null>(null);
  activeJob = computed<ActiveJobInfo | null>(() => this.jobStatus()?.activeJob ?? null);
  availableJobs = computed<JobInfo[]>(() => this.jobStatus()?.availableJobs ?? []);
  pendingWages = signal<number>(0);

  educationStatus = signal<EducationStatusResponse | null>(null);
  activeCourse = computed<ActiveCourseInfo | null>(
    () => this.educationStatus()?.activeCourse ?? null,
  );
  availableCourses = computed<CourseInfo[]>(() => this.educationStatus()?.availableCourses ?? []);
  courseRemainingMs = signal<number>(0);

  intelligence = computed(() => this.gameUser()?.stats?.intelligence ?? 0);
  branks = computed(() => this.gameUser()?.balance ?? 0);

  // ─── Stock signals ──────────────────────────────────────────────────────
  stockQuotes = signal<StockInfo[]>([]);
  portfolio = signal<PortfolioResponse | null>(null);
  netWorth = computed(() => this.portfolio()?.netWorth ?? this.branks());
  stockTab = signal<'market' | 'portfolio' | 'mycompany' | 'orders'>('market');
  selectedStock = signal<StockInfo | null>(null);
  tradeModalOpen = signal(false);
  pendingOrders = signal<PendingOrder[]>([]);
  readonly SECTOR_OPTIONS = SECTOR_OPTIONS;
  ipoForm = signal({
    name: '',
    ticker: '',
    sector: 'IT' as Sector,
    totalSupply: 100000,
    initialPricePerShare: 10,
    publicFloatPct: 30,
  });
  diluteQty = signal<number>(0);

  /** Top movers for collapsed card: sorted by absolute % change, take top 3 */
  topMovers = computed<StockInfo[]>(() => {
    return [...this.stockQuotes()]
      .sort((a, b) => Math.abs(b.priceChangePct24h) - Math.abs(a.priceChangePct24h))
      .slice(0, 3);
  });

  /** Stocks the user currently holds shares in (for collapsed chart view) */
  investedStocks = computed<StockInfo[]>(() => {
    const holdings = this.portfolio()?.holdings ?? [];
    const heldIds = new Set(holdings.filter((h) => h.sharesOwned > 0).map((h) => h.stockId));
    return this.stockQuotes().filter((s) => heldIds.has(s.id));
  });

  private clockInterval: ReturnType<typeof setInterval> | null = null;
  private wageInterval: ReturnType<typeof setInterval> | null = null;
  private courseInterval: ReturnType<typeof setInterval> | null = null;
  private disconnectWs: (() => void) | null = null;

  constructor() {
    effect(() => {
      if (this.user() === null) {
        this.router.navigate(['/game/auth']);
      }
    });
    this.startGameClock();
  }

  ngOnInit() {
    this.checkUser();
  }

  ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.wageInterval) clearInterval(this.wageInterval);
    if (this.courseInterval) clearInterval(this.courseInterval);
    this.disconnectWs?.();
  }

  startGameClock() {
    const tick = () => {
      const realNow = Date.now();
      const gameMs = realNow * GAME_TIME_MULTIPLIER;
      const gameDate = new Date(gameMs);

      const hour = gameDate.getUTCHours();
      this.isNight.set(hour >= 18 || hour < 6);

      const mins = gameDate.getUTCMinutes().toString().padStart(2, '0');
      const displayHour = hour % 12 || 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      this.gameTime.set(`${displayHour}:${mins} ${ampm}`);

      const day = gameDate.getUTCDate();
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const month = monthNames[gameDate.getUTCMonth()];
      const year = gameDate.getUTCFullYear();
      let suffix = 'th';
      if (day === 1 || day === 21 || day === 31) suffix = 'st';
      else if (day === 2 || day === 22) suffix = 'nd';
      else if (day === 3 || day === 23) suffix = 'rd';
      this.gameDate.set(`${day}${suffix} ${month} ${year}`);
    };

    tick();
    this.clockInterval = setInterval(tick, 1000);
  }

  private startWageTicker() {
    if (this.wageInterval) clearInterval(this.wageInterval);
    this.wageInterval = setInterval(() => {
      const job = this.activeJob();
      if (!job) {
        this.pendingWages.set(0);
        return;
      }
      // effectiveHourlyRate already accounts for intelligence (computed server-side).
      // branksPerRealSec = effectiveHourlyRate / 60  (1 game-hour = 60 real-seconds)
      const elapsedSec = (Date.now() - job.lastClaimedAt) / 1000;
      const branksPerSec = job.effectiveHourlyRate / 60;
      this.pendingWages.set(Math.floor(elapsedSec * branksPerSec));
    }, 1000);
  }

  private startCourseCountdown() {
    if (this.courseInterval) clearInterval(this.courseInterval);
    this.courseInterval = setInterval(() => {
      const course = this.activeCourse();
      if (!course || course.complete) {
        this.courseRemainingMs.set(0);
        return;
      }
      const remaining = Math.max(0, course.completesAt - Date.now());
      this.courseRemainingMs.set(remaining);
      // Auto-refresh once the timer hits zero
      if (remaining === 0) {
        this.refreshEducation();
      }
    }, 1000);
  }

  checkUser() {
    this.userService.findUser().subscribe({
      next: (res) => {
        this.gameUser.set(res);
        this.loadJobStatus();
        this.loadEducationStatus();
        this.loadStocks();
        this.loadPortfolio();
      },
      error: (err) => {
        if (err.status === 404) {
          this.showModal.set(true);
        }
      },
    });
  }

  onModalSubmit(displayName: string) {
    this.userService.createUser(displayName).subscribe({
      next: () => {
        this.showModal.set(false);
        this.checkUser();
      },
      error: (err) => {
        this.toast.show('Failed to create user: ' + (err.statusText ?? 'Unknown error'), 'error');
      },
    });
  }

  loadJobStatus() {
    this.userService.getJobStatus().subscribe({
      next: (res) => {
        this.jobStatus.set(res);
        if (res.activeJob) {
          this.pendingWages.set(res.activeJob.pendingWages);
          this.startWageTicker();
        }
      },
      error: () => {},
    });
  }

  startJob(jobId: string) {
    this.userService.startJob(jobId).subscribe({
      next: (res) => {
        if (res.user) this.gameUser.set(res.user);
        this.toast.show('Job started!');
        this.loadJobStatus();
      },
      error: (err) => {
        this.toast.show(err.error?.responseMessage ?? 'Could not start job.', 'error');
      },
    });
  }

  quitJob() {
    this.userService.quitJob().subscribe({
      next: (res) => {
        if (res.user) this.gameUser.set(res.user);
        this.toast.show('Job quit. Wages claimed.');
        if (this.wageInterval) clearInterval(this.wageInterval);
        this.pendingWages.set(0);
        this.loadJobStatus();
      },
      error: (err) => {
        this.toast.show(err.error?.responseMessage ?? 'Could not quit job.', 'error');
      },
    });
  }

  claimWage() {
    this.userService.claimWage().subscribe({
      next: (res) => {
        if (res.user) this.gameUser.set(res.user);
        this.toast.show(`Claimed ${res.wagesClaimed} Branks!`);
        // Stop ticker immediately so it doesn't overshoot while the status reloads
        if (this.wageInterval) {
          clearInterval(this.wageInterval);
          this.wageInterval = null;
        }
        this.pendingWages.set(0);
        this.loadJobStatus();
      },
      error: (err) => {
        this.toast.show(err.error?.responseMessage ?? 'Could not claim wages.', 'error');
      },
    });
  }

  loadEducationStatus() {
    this.userService.getEducationStatus().subscribe({
      next: (res) => {
        this.educationStatus.set(res);
        if (res.activeCourse && !res.activeCourse.complete) {
          this.courseRemainingMs.set(res.activeCourse.remainingMs);
          this.startCourseCountdown();
        }
      },
      error: () => {},
    });
  }

  refreshEducation() {
    this.userService.getEducationStatus().subscribe({
      next: (res) => this.educationStatus.set(res),
      error: () => {},
    });
  }

  enrollCourse(courseId: string) {
    this.userService.enrollCourse(courseId).subscribe({
      next: (res) => {
        if (res.user) this.gameUser.set(res.user);
        this.toast.show('Enrolled! Study hard.');
        this.loadEducationStatus();
        this.loadJobStatus();
      },
      error: (err) => {
        this.toast.show(err.error?.responseMessage ?? 'Could not enroll.', 'error');
      },
    });
  }

  completeCourse() {
    this.userService.completeCourse().subscribe({
      next: (res) => {
        if (res.user) this.gameUser.set(res.user);
        this.toast.show('Course complete! Intelligence increased.');
        if (this.courseInterval) clearInterval(this.courseInterval);
        this.courseRemainingMs.set(0);
        this.loadEducationStatus();
      },
      error: (err) => {
        this.toast.show(err.error?.responseMessage ?? 'Could not complete course.', 'error');
      },
    });
  }

  // ─── Stock methods ───────────────────────────────────────────────────────

  loadStocks() {
    this.stockService.getAllStocks().subscribe({
      next: (res) => {
        this.stockQuotes.set(res.stocks);
        this.startPriceStream(res.stocks.map((s) => s.id));
      },
      error: () => {},
    });
  }

  loadPortfolio() {
    this.stockService.getPortfolio().subscribe({
      next: (res) => this.portfolio.set(res),
      error: () => {},
    });
  }

  private startPriceStream(stockIds: string[]) {
    this.disconnectWs?.();
    this.disconnectWs = this.stockService.connectPriceStream(stockIds, (tick: PriceTick) => {
      this.stockQuotes.update((quotes) =>
        quotes.map((q) =>
          q.id === tick.stockId
            ? {
                ...q,
                currentPrice: tick.price,
                liquidityBranks: tick.liquidityBranks,
                liquidityShares: tick.liquidityShares,
                priceHistory: [...(q.priceHistory ?? []).slice(-99), tick.price],
              }
            : q,
        ),
      );
    });
  }

  openTradeModal(stock: StockInfo) {
    this.selectedStock.set(stock);
    this.tradeModalOpen.set(true);
  }

  onTradeComplete(updatedUser: UserResponse) {
    this.gameUser.set(updatedUser);
    this.tradeModalOpen.set(false);
    this.selectedStock.set(null);
    this.loadPortfolio();
    this.loadStocks();
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
    this.stockService.createIPO(req).subscribe({
      next: () => {
        this.toast.show(`${req.ticker} is now listed on the exchange!`);
        this.loadStocks();
        this.loadPortfolio();
        this.userService.findUser().subscribe({ next: (u) => this.gameUser.set(u) });
      },
      error: (err) => {
        this.toast.show(err.error?.responseMessage ?? 'IPO failed.', 'error');
      },
    });
  }

  /** True if the user has already launched an IPO (is the founder of any stock) */
  hasOwnIPO = computed<boolean>(() =>
    this.stockQuotes().some((s) => s.founderClerkId === this.user()?.id),
  );

  /** The stock the current user founded, if any */
  myCompany = computed<StockInfo | null>(
    () => this.stockQuotes().find((s) => s.founderClerkId === this.user()?.id) ?? null,
  );

  setIpoName(v: string) {
    this.ipoForm.update((f) => ({ ...f, name: v }));
  }
  setIpoTicker(v: string) {
    this.ipoForm.update((f) => ({ ...f, ticker: v.toUpperCase() }));
  }
  setIpoSector(v: Sector) {
    this.ipoForm.update((f) => ({ ...f, sector: v }));
  }
  setIpoTotalSupply(v: number) {
    this.ipoForm.update((f) => ({ ...f, totalSupply: v }));
  }
  setIpoInitialPrice(v: number) {
    this.ipoForm.update((f) => ({ ...f, initialPricePerShare: v }));
  }
  setIpoPublicFloat(v: number) {
    this.ipoForm.update((f) => ({ ...f, publicFloatPct: v }));
  }

  getHoldingForStock(stockId: string): HoldingInfo | null {
    return this.portfolio()?.holdings.find((h) => h.stockId === stockId) ?? null;
  }

  formatPrice(price: number): string {
    if (price >= 1000) return price.toFixed(0);
    if (price >= 10) return price.toFixed(1);
    return price.toFixed(2);
  }

  formatPriceChange(pct: number): string {
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  }

  getChartScheme(index: number) {
    return CHART_SCHEMES[index % CHART_SCHEMES.length];
  }

  getStockHistory(stockId: string): number[] {
    return this.stockQuotes().find((s) => s.id === stockId)?.priceHistory ?? [];
  }

  getTickerForStockId(stockId: string): string {
    return this.stockQuotes().find((s) => s.id === stockId)?.ticker ?? stockId.slice(0, 6);
  }

  loadPendingOrders() {
    this.stockService.getPendingOrders().subscribe({
      next: (orders) => this.pendingOrders.set(orders),
      error: () => {},
    });
  }

  cancelOrder(orderId: string) {
    this.stockService.cancelLimitOrder(orderId).subscribe({
      next: () => {
        this.toast.show('Order cancelled.');
        this.loadPendingOrders();
      },
      error: (err) => {
        this.toast.show(err.error?.responseMessage ?? 'Could not cancel order.', 'error');
      },
    });
  }

  dilute() {
    const co = this.myCompany();
    if (!co) return;
    const qty = this.diluteQty();
    if (!qty || qty <= 0) {
      this.toast.show('Enter a valid quantity to dilute.', 'error');
      return;
    }
    const req: DiluteRequest = { quantity: qty };
    this.stockService.dilute(co.id, req).subscribe({
      next: (res) => {
        this.toast.show(
          `Diluted ${res.sharesTransacted | 0} shares for ${res.branksDelta | 0} Branks.`,
        );
        this.diluteQty.set(0);
        if (res.user) this.gameUser.set(res.user);
        this.loadStocks();
        this.loadPortfolio();
      },
      error: (err) => {
        this.toast.show(err.error?.responseMessage ?? 'Dilution failed.', 'error');
      },
    });
  }

  // ─── Overlay ─────────────────────────────────────────────────────────────

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  expand(section: string) {
    // Cancel any pending close cleanup
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.expandedSection.set(section);
    // Allow the DOM to render hidden overlay, then trigger transition
    requestAnimationFrame(() => {
      this.overlayVisible.set(true);
    });
  }

  close(event?: Event) {
    if (event) event.stopPropagation();
    // Start the CSS exit transition
    this.overlayVisible.set(false);
    // After transition ends, remove content from DOM
    this.closeTimer = setTimeout(() => {
      this.expandedSection.set(null);
      this.closeTimer = null;
    }, 350);
  }

  formatCountdown(ms: number): string {
    if (ms <= 0) return 'Complete!';
    const totalSeconds = Math.floor(ms / 1000);
    // 1 real second = 1 game minute
    const gameMinutes = totalSeconds;
    const gameDays = Math.floor(gameMinutes / (24 * 60));
    const gameHours = Math.floor((gameMinutes % (24 * 60)) / 60);
    const mins = gameMinutes % 60;
    const parts: string[] = [];
    if (gameDays > 0) parts.push(`${gameDays}d`);
    if (gameHours > 0) parts.push(`${gameHours}h`);
    parts.push(`${mins}m`);
    return parts.join(' ');
  }

  formatDuration(seconds: number): string {
    const gameMinutes = seconds; // 1 real second = 1 game minute
    const gameDays = Math.floor(gameMinutes / (24 * 60));
    const gameHours = Math.floor((gameMinutes % (24 * 60)) / 60);
    const mins = gameMinutes % 60;
    const parts: string[] = [];
    if (gameDays > 0) parts.push(`${gameDays}d`);
    if (gameHours > 0) parts.push(`${gameHours}h`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
    return parts.join(' ');
  }
}
