import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '@stomp/stompjs';
import { CONFIG } from '../config/environment';
import { ENDPOINTS } from '../config/endpoints';
import {
  DiluteRequest,
  IPOCreateRequest,
  LimitOrderRequest,
  LimitOrderResponse,
  PendingOrder,
  PortfolioResponse,
  PriceTick,
  StockInfo,
  StockQuoteResponse,
  TradeRequest,
  TradeResponse,
} from '../types/api/stock.types';
import { NewsItem } from '../types/api/news.types';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private http = inject(HttpClient);
  private stompClient: Client | null = null;

  getAllStocks(): Observable<StockQuoteResponse> {
    return this.http.get<StockQuoteResponse>(`${CONFIG.API_URL}${ENDPOINTS.GET_STOCKS}`);
  }

  getStock(stockId: string): Observable<StockInfo> {
    return this.http.get<StockInfo>(`${CONFIG.API_URL}${ENDPOINTS.GET_STOCKS}/${stockId}`);
  }

  trade(req: TradeRequest): Observable<TradeResponse> {
    return this.http.post<TradeResponse>(`${CONFIG.API_URL}${ENDPOINTS.TRADE_STOCK}`, req);
  }

  placeLimitOrder(req: LimitOrderRequest): Observable<LimitOrderResponse> {
    return this.http.post<LimitOrderResponse>(
      `${CONFIG.API_URL}${ENDPOINTS.PLACE_LIMIT_ORDER}`,
      req,
    );
  }

  cancelLimitOrder(orderId: string): Observable<LimitOrderResponse> {
    return this.http.delete<LimitOrderResponse>(
      `${CONFIG.API_URL}${ENDPOINTS.CANCEL_LIMIT_ORDER}/${orderId}`,
    );
  }

  getPendingOrders(): Observable<PendingOrder[]> {
    return this.http.get<PendingOrder[]>(`${CONFIG.API_URL}${ENDPOINTS.GET_LIMIT_ORDERS}`);
  }

  getPortfolio(): Observable<PortfolioResponse> {
    return this.http.get<PortfolioResponse>(`${CONFIG.API_URL}${ENDPOINTS.GET_PORTFOLIO}`);
  }

  createIPO(req: IPOCreateRequest): Observable<StockInfo> {
    return this.http.post<StockInfo>(`${CONFIG.API_URL}${ENDPOINTS.CREATE_IPO}`, req);
  }

  dilute(stockId: string, req: DiluteRequest): Observable<TradeResponse> {
    return this.http.post<TradeResponse>(
      `${CONFIG.API_URL}${ENDPOINTS.DILUTE}/${stockId}/dilute`,
      req,
    );
  }

  /** Connects to the STOMP WebSocket and subscribes to price updates for all given stockIds. */
  connectPriceStream(
    stockIds: string[],
    onTick: (tick: PriceTick) => void,
    onNews?: (item: NewsItem) => void,
  ): () => void {
    this.stompClient = new Client({
      brokerURL: `${CONFIG.WS_URL}/ws/stocks`,
      reconnectDelay: 5000,
    });

    this.stompClient.onConnect = () => {
      for (const stockId of stockIds) {
        this.stompClient!.subscribe(`/topic/price/${stockId}`, (msg) => {
          try {
            onTick(JSON.parse(msg.body) as PriceTick);
          } catch {
            // malformed message — ignore
          }
        });
      }
      if (onNews) {
        this.stompClient!.subscribe('/topic/news', (msg) => {
          try {
            onNews(JSON.parse(msg.body) as NewsItem);
          } catch {
            // malformed message — ignore
          }
        });
      }
    };

    this.stompClient.activate();

    return () => {
      this.stompClient?.deactivate();
      this.stompClient = null;
    };
  }

  getNews(): Observable<NewsItem[]> {
    return this.http.get<NewsItem[]>(`${CONFIG.API_URL}${ENDPOINTS.GET_NEWS}`);
  }

  disconnectPriceStream() {
    this.stompClient?.deactivate();
    this.stompClient = null;
  }
}
