export interface NewsItem {
  id: string;
  headline: string;
  body: string;
  /** "COMPANY" | "SECTOR" */
  targetType: string;
  /** stockId or sector enum name */
  targetId: string;
  /** e.g. "Lyfe Corp" or "Technology & IT" */
  targetLabel: string;
  /** null for sector events */
  ticker: string | null;
  /** Signed impact pct, e.g. -8.5 or +6.2 */
  impactPct: number;
  publishedAt: number;
  expiresAt: number;
}
