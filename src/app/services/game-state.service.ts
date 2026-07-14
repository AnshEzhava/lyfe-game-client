import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ClerkService } from 'ngx-clerk';
import { UserService } from './user.service';
import { StockService } from './stock.service';
import { ToastService } from './toast.service';
import {
  ActiveCourseInfo,
  ActiveJobInfo,
  ActivityEvent,
  CourseInfo,
  EducationStatusResponse,
  JobInfo,
  JobStatusResponse,
  UserResponse,
  UserSettings,
  WhileAwaySummary,
} from '../types/api/user.types';
import {
  DiluteRequest,
  HoldingInfo,
  IPOCreateRequest,
  PendingOrder,
  PortfolioResponse,
  PriceTick,
  StockInfo,
} from '../types/api/stock.types';
import { NewsItem } from '../types/api/news.types';
import { DonutSegment } from '../components/portfolio-donut/portfolio-donut';

/** Playful Lyfe-world category palette (kept in sync with the --accent-* tokens in styles.css). */
// Pixel-arcade tile palette (kept in sync with the --accent-* tokens in styles.css).
export const CHART_SCHEMES = [
  { stroke: '#ff4d6d', bg: 'rgba(255,77,109,0.10)', border: 'rgba(255,77,109,0.45)' },
  { stroke: '#4dd2ff', bg: 'rgba(77,210,255,0.10)', border: 'rgba(77,210,255,0.45)' },
  { stroke: '#ffd23f', bg: 'rgba(255,210,63,0.10)', border: 'rgba(255,210,63,0.45)' },
  { stroke: '#4dff88', bg: 'rgba(77,255,136,0.10)', border: 'rgba(77,255,136,0.45)' },
  { stroke: '#c77dff', bg: 'rgba(199,125,255,0.10)', border: 'rgba(199,125,255,0.45)' },
  { stroke: '#ff9f4d', bg: 'rgba(255,159,77,0.10)', border: 'rgba(255,159,77,0.45)' },
  { stroke: '#ff9fb0', bg: 'rgba(255,159,176,0.10)', border: 'rgba(255,159,176,0.45)' },
  { stroke: '#4dff88', bg: 'rgba(77,255,136,0.10)', border: 'rgba(77,255,136,0.45)' },
];

/**
 * Central signals store for the in-game screens. Holds all shared game state, owns the
 * data-loading + action methods, the wage/course timers, and the STOMP price/news stream.
 * The PlayShell boots it once; sections read from it and call its actions.
 */
@Injectable({ providedIn: 'root' })
export class GameStateService {
  private clerk = inject(ClerkService);
  private userService = inject(UserService);
  private stockService = inject(StockService);
  private toast = inject(ToastService);

  readonly clerkUser = toSignal(this.clerk.user$);

  // ─── State ────────────────────────────────────────────────────────────────
  readonly gameUser = signal<UserResponse | null>(null);
  readonly needsDisplayName = signal(false);

  readonly whileAwaySummary = signal<WhileAwaySummary | null>(null);
  readonly afkSettings = signal<UserSettings>({ autoClaimWages: false, autoReinvest: false });
  readonly activityEvents = signal<ActivityEvent[]>([]);

  readonly jobStatus = signal<JobStatusResponse | null>(null);
  readonly pendingWages = signal<number>(0);
  readonly educationStatus = signal<EducationStatusResponse | null>(null);
  readonly courseRemainingMs = signal<number>(0);

  readonly stockQuotes = signal<StockInfo[]>([]);
  readonly portfolio = signal<PortfolioResponse | null>(null);
  readonly pendingOrders = signal<PendingOrder[]>([]);
  readonly newsItems = signal<NewsItem[]>([]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  readonly intelligence = computed(() => this.gameUser()?.stats?.intelligence ?? 0);
  readonly branks = computed(() => this.gameUser()?.balance ?? 0);
  readonly netWorth = computed(() => this.portfolio()?.netWorth ?? this.branks());

  readonly activeJob = computed<ActiveJobInfo | null>(() => this.jobStatus()?.activeJob ?? null);
  readonly availableJobs = computed<JobInfo[]>(() => this.jobStatus()?.availableJobs ?? []);
  readonly activeCourse = computed<ActiveCourseInfo | null>(
    () => this.educationStatus()?.activeCourse ?? null,
  );
  readonly availableCourses = computed<CourseInfo[]>(
    () => this.educationStatus()?.availableCourses ?? [],
  );

  readonly topMovers = computed<StockInfo[]>(() =>
    [...this.stockQuotes()]
      .sort((a, b) => Math.abs(b.priceChangePct24h) - Math.abs(a.priceChangePct24h))
      .slice(0, 3),
  );

  readonly investedStocks = computed<StockInfo[]>(() => {
    const heldIds = new Set(
      (this.portfolio()?.holdings ?? []).filter((h) => h.sharesOwned > 0).map((h) => h.stockId),
    );
    return this.stockQuotes().filter((s) => heldIds.has(s.id));
  });

  readonly heldStockIds = computed<Set<string>>(() => {
    const ids = new Set(
      (this.portfolio()?.holdings ?? []).filter((h) => h.sharesOwned > 0).map((h) => h.stockId),
    );
    const co = this.myCompany();
    if (co) ids.add(co.id);
    return ids;
  });

  readonly heldSectors = computed<Set<string>>(() => {
    const ids = this.heldStockIds();
    return new Set(
      this.stockQuotes()
        .filter((s) => ids.has(s.id) && s.sector)
        .map((s) => s.sector!),
    );
  });

  readonly hasOwnIPO = computed<boolean>(() =>
    this.stockQuotes().some((s) => s.founderClerkId === this.clerkUser()?.id),
  );

  readonly myCompany = computed<StockInfo | null>(
    () => this.stockQuotes().find((s) => s.founderClerkId === this.clerkUser()?.id) ?? null,
  );

  readonly portfolioSegments = computed<DonutSegment[]>(() => {
    const p = this.portfolio();
    const segments: DonutSegment[] = [];
    segments.push({ label: 'Cash', value: this.branks(), color: 'var(--accent-sun)' });
    (p?.holdings ?? []).forEach((h, i) => {
      if (h.currentValue > 0) {
        segments.push({
          label: h.ticker,
          value: h.currentValue,
          color: CHART_SCHEMES[i % CHART_SCHEMES.length].stroke,
        });
      }
    });
    const co = this.myCompany();
    if (co && p) {
      const equity = Math.max(
        0,
        (p.netWorth ?? 0) - this.branks() - (p.holdings ?? []).reduce((s, h) => s + h.currentValue, 0),
      );
      if (equity > 0)
        segments.push({ label: co.ticker + ' equity', value: equity, color: 'var(--accent-grape)' });
    }
    return segments;
  });

  // ─── Timers + websocket ─────────────────────────────────────────────────────
  private wageInterval: ReturnType<typeof setInterval> | null = null;
  private courseInterval: ReturnType<typeof setInterval> | null = null;
  private disconnectWs: (() => void) | null = null;

  // ─── Boot / teardown ────────────────────────────────────────────────────────
  boot() {
    this.userService.findUser().subscribe({
      next: (res) => {
        this.gameUser.set(res);
        this.needsDisplayName.set(false);
        this.resumeSession();
        this.loadSettings();
        this.loadActivity();
        this.loadJobStatus();
        this.loadEducationStatus();
        this.loadStocks();
        this.loadPortfolio();
        this.loadNews();
        this.loadPendingOrders();
      },
      error: (err) => {
        if (err.status === 404) this.needsDisplayName.set(true);
      },
    });
  }

  teardown() {
    if (this.wageInterval) clearInterval(this.wageInterval);
    if (this.courseInterval) clearInterval(this.courseInterval);
    this.disconnectWs?.();
    this.wageInterval = this.courseInterval = null;
    this.disconnectWs = null;
  }

  createUser(displayName: string) {
    this.userService.createUser(displayName).subscribe({
      next: () => {
        this.needsDisplayName.set(false);
        this.boot();
      },
      error: (err) =>
        this.toast.show('Failed to create user: ' + (err.statusText ?? 'Unknown error'), 'error'),
    });
  }

  // ─── AFK / offline loop ───────────────────────────────────────────────────
  resumeSession() {
    this.userService.resumeSession().subscribe({
      next: (summary) => {
        if (summary.user) this.gameUser.set(summary.user);
        if (summary.hasSummary) this.whileAwaySummary.set(summary);
      },
      error: () => {},
    });
  }

  dismissWelcomeBack() {
    this.whileAwaySummary.set(null);
    this.loadJobStatus();
    this.loadPortfolio();
    this.loadActivity();
  }

  loadSettings() {
    this.userService.getSettings().subscribe({
      next: (res) =>
        this.afkSettings.set({ autoClaimWages: res.autoClaimWages, autoReinvest: res.autoReinvest }),
      error: () => {},
    });
  }

  toggleAutoClaim() {
    const next = { ...this.afkSettings(), autoClaimWages: !this.afkSettings().autoClaimWages };
    if (!next.autoClaimWages) next.autoReinvest = false;
    this.saveSettings(next);
  }

  toggleAutoReinvest() {
    const next = { ...this.afkSettings(), autoReinvest: !this.afkSettings().autoReinvest };
    if (next.autoReinvest) next.autoClaimWages = true;
    this.saveSettings(next);
  }

  private saveSettings(next: UserSettings) {
    this.afkSettings.set(next);
    this.userService.updateSettings(next).subscribe({
      next: (res) =>
        this.afkSettings.set({ autoClaimWages: res.autoClaimWages, autoReinvest: res.autoReinvest }),
      error: () => this.toast.show('Failed to update settings', 'error'),
    });
  }

  loadActivity() {
    this.userService.getActivity().subscribe({
      next: (res) => this.activityEvents.set([...res.events].reverse()),
      error: () => {},
    });
  }

  // ─── Jobs ─────────────────────────────────────────────────────────────────
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
      error: (err) => this.toast.show(err.error?.responseMessage ?? 'Could not start job.', 'error'),
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
      error: (err) => this.toast.show(err.error?.responseMessage ?? 'Could not quit job.', 'error'),
    });
  }

  claimWage() {
    this.userService.claimWage().subscribe({
      next: (res) => {
        if (res.user) this.gameUser.set(res.user);
        this.toast.show(`Claimed ${res.wagesClaimed} Branks!`);
        if (this.wageInterval) {
          clearInterval(this.wageInterval);
          this.wageInterval = null;
        }
        this.pendingWages.set(0);
        this.loadJobStatus();
      },
      error: (err) => this.toast.show(err.error?.responseMessage ?? 'Could not claim wages.', 'error'),
    });
  }

  private startWageTicker() {
    if (this.wageInterval) clearInterval(this.wageInterval);
    this.wageInterval = setInterval(() => {
      const job = this.activeJob();
      if (!job) {
        this.pendingWages.set(0);
        return;
      }
      const elapsedSec = (Date.now() - job.lastClaimedAt) / 1000;
      this.pendingWages.set(Math.floor(elapsedSec * (job.effectiveHourlyRate / 60)));
    }, 1000);
  }

  // ─── Education ──────────────────────────────────────────────────────────────
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
      error: (err) => this.toast.show(err.error?.responseMessage ?? 'Could not enroll.', 'error'),
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
      error: (err) =>
        this.toast.show(err.error?.responseMessage ?? 'Could not complete course.', 'error'),
    });
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
      if (remaining === 0) this.refreshEducation();
    }, 1000);
  }

  // ─── Stocks / market ─────────────────────────────────────────────────────────
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

  loadPendingOrders() {
    this.stockService.getPendingOrders().subscribe({
      next: (orders) => this.pendingOrders.set(orders),
      error: () => {},
    });
  }

  loadNews() {
    this.stockService.getNews().subscribe({
      next: (items) => this.newsItems.set(items),
      error: () => {},
    });
  }

  private startPriceStream(stockIds: string[]) {
    this.disconnectWs?.();
    this.disconnectWs = this.stockService.connectPriceStream(
      stockIds,
      (tick: PriceTick) => {
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
      },
      (item: NewsItem) => {
        this.newsItems.update((prev) =>
          prev.some((n) => n.id === item.id) ? prev : [item, ...prev].slice(0, 50),
        );
      },
    );
  }

  onTradeComplete(updatedUser: UserResponse) {
    this.gameUser.set(updatedUser);
    this.loadPortfolio();
    this.loadStocks();
  }

  /** Apply an updated user snapshot (e.g. after a casino play) and refresh the activity feed. */
  applyUserUpdate(updatedUser: UserResponse | null) {
    if (updatedUser) this.gameUser.set(updatedUser);
    this.loadActivity();
  }

  submitIPO(req: IPOCreateRequest) {
    this.stockService.createIPO(req).subscribe({
      next: () => {
        this.toast.show(`${req.ticker} is now listed on the exchange!`);
        this.loadStocks();
        this.loadPortfolio();
        this.userService.findUser().subscribe({ next: (u) => this.gameUser.set(u) });
      },
      error: (err) => this.toast.show(err.error?.responseMessage ?? 'IPO failed.', 'error'),
    });
  }

  dilute(qty: number) {
    const co = this.myCompany();
    if (!co) return;
    if (!qty || qty <= 0) {
      this.toast.show('Enter a valid quantity to dilute.', 'error');
      return;
    }
    const req: DiluteRequest = { quantity: qty };
    this.stockService.dilute(co.id, req).subscribe({
      next: (res) => {
        this.toast.show(`Diluted ${res.sharesTransacted | 0} shares for ${res.branksDelta | 0} Branks.`);
        if (res.user) this.gameUser.set(res.user);
        this.loadStocks();
        this.loadPortfolio();
      },
      error: (err) => this.toast.show(err.error?.responseMessage ?? 'Dilution failed.', 'error'),
    });
  }

  cancelOrder(orderId: string) {
    this.stockService.cancelLimitOrder(orderId).subscribe({
      next: () => {
        this.toast.show('Order cancelled.');
        this.loadPendingOrders();
      },
      error: (err) => this.toast.show(err.error?.responseMessage ?? 'Could not cancel order.', 'error'),
    });
  }

  // ─── View helpers ─────────────────────────────────────────────────────────
  getHoldingForStock(stockId: string): HoldingInfo | null {
    return this.portfolio()?.holdings.find((h) => h.stockId === stockId) ?? null;
  }

  getStockHistory(stockId: string): number[] {
    return this.stockQuotes().find((s) => s.id === stockId)?.priceHistory ?? [];
  }

  getTickerForStockId(stockId: string): string {
    return this.stockQuotes().find((s) => s.id === stockId)?.ticker ?? stockId.slice(0, 6);
  }

  getChartScheme(index: number) {
    return CHART_SCHEMES[index % CHART_SCHEMES.length];
  }

  formatPrice(price: number): string {
    if (price >= 1000) return price.toFixed(0);
    if (price >= 10) return price.toFixed(1);
    return price.toFixed(2);
  }

  formatPriceChange(pct: number): string {
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  }

  formatImpact(pct: number): string {
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  }

  formatNewsTime(ms: number): string {
    const secs = Math.floor((Date.now() - ms) / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  formatCountdown(ms: number): string {
    if (ms <= 0) return 'Complete!';
    return this.formatDuration(Math.floor(ms / 1000));
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
