export interface StockInfo {
  id: string;
  ticker: string;
  name: string;
  govtBond: boolean;
  currentPrice: number;
  priceChange24h: number;
  priceChangePct24h: number;
  liquidityBranks: number;
  liquidityShares: number;
  totalSupply: number;
  yieldRateBps: number;
  priceHistory: number[];
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
  totalSupply: number;
  initialPricePerShare: number;
  publicFloatPct: number;
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
