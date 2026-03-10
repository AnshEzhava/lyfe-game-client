export type Sector =
  | 'IT'
  | 'FINANCE'
  | 'HEALTHCARE'
  | 'ENERGY'
  | 'AGRICULTURE'
  | 'TRADE'
  | 'SCIENCE'
  | 'ENTERTAINMENT'
  | 'MANUFACTURING'
  | 'REAL_ESTATE';

export const SECTOR_LABELS: Record<Sector, string> = {
  IT: 'Technology & IT',
  FINANCE: 'Finance & Banking',
  HEALTHCARE: 'Healthcare & Pharma',
  ENERGY: 'Energy & Utilities',
  AGRICULTURE: 'Agriculture & Food',
  TRADE: 'Retail & Trade',
  SCIENCE: 'Research & Science',
  ENTERTAINMENT: 'Entertainment & Media',
  MANUFACTURING: 'Manufacturing',
  REAL_ESTATE: 'Real Estate',
};

export const SECTOR_OPTIONS: { value: Sector; label: string }[] = (
  Object.keys(SECTOR_LABELS) as Sector[]
).map((k) => ({ value: k, label: SECTOR_LABELS[k] }));

export interface StockInfo {
  id: string;
  ticker: string;
  name: string;
  govtBond: boolean;
  sector: Sector | null;
  currentPrice: number;
  priceChange24h: number;
  priceChangePct24h: number;
  liquidityBranks: number;
  liquidityShares: number;
  totalSupply: number;
  yieldRateBps: number;
  priceHistory: number[];
  founderClerkId: string | null;
  founderSharesRetained: number;
}

export interface StockQuoteResponse {
  responseCode: number;
  responseMessage: string;
  stocks: StockInfo[];
}

export interface TradeRequest {
  stockId: string;
  action: 'BUY' | 'SELL';
  quantity: number;
}

export interface TradeResponse {
  responseCode: number;
  responseMessage: string;
  sharesTransacted: number;
  avgPrice: number;
  branksDelta: number;
  newPoolPrice: number;
  user: import('./user.types').UserResponse | null;
}

export interface LimitOrderRequest {
  stockId: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  limitPrice: number;
}

export interface LimitOrderResponse {
  responseCode: number;
  responseMessage: string;
  orderId: string;
  stockId: string;
  action: string;
  quantity: number;
  limitPrice: number;
  status: string;
}

export interface HoldingInfo {
  stockId: string;
  ticker: string;
  name: string;
  sharesOwned: number;
  currentPrice: number;
  currentValue: number;
}

export interface PortfolioResponse {
  responseCode: number;
  responseMessage: string;
  holdings: HoldingInfo[];
  netWorth: number;
  branks: number;
}

export interface IPOCreateRequest {
  name: string;
  ticker: string;
  sector: Sector;
  totalSupply: number;
  initialPricePerShare: number;
  publicFloatPct: number;
}

export interface DiluteRequest {
  quantity: number;
}

export interface PriceTick {
  stockId: string;
  ticker: string;
  price: number;
  liquidityBranks: number;
  liquidityShares: number;
  timestamp: number;
}

/** Raw LimitOrder entity returned by GET /api/stocks/limit */
export interface PendingOrder {
  id: string;
  stockId: string;
  clerkId: string;
  action: string;
  quantity: number;
  limitPrice: number;
  placedAt: number;
  status: string;
}
