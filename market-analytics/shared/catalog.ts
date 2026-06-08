// Shared tool catalog — imported by BOTH the client (to render forms) and the
// server (to validate requests). It intentionally contains NO prompt text:
// the prompt engineering lives server-side in server/prompts.ts so it never
// ships in the browser bundle.

export type FieldType = "text" | "textarea" | "number" | "select";

export interface ToolField {
  /** key used in the inputs map sent to the API */
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  /** options for select fields */
  options?: string[];
  /** default value */
  default?: string;
  required?: boolean;
  /** helper text shown under the field */
  hint?: string;
}

export interface Tool {
  id: string;
  /** short number shown on the card, e.g. "01" */
  index: string;
  title: string;
  tagline: string;
  category: "Strategy" | "Risk" | "Portfolio" | "Research";
  fields: ToolField[];
}

const MARKETS = ["Crypto", "Stocks", "Forex", "Futures", "Options"];
const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];
const RISK_LEVELS = ["Low", "Medium", "High"];

export const TOOLS: Tool[] = [
  {
    id: "strategy-generation",
    index: "01",
    title: "Strategy Generation",
    tagline: "Generate 3 profitable, fully-specified trading strategies.",
    category: "Strategy",
    fields: [
      { key: "market", label: "Market", type: "select", options: MARKETS, default: "Crypto", required: true },
      { key: "timeframe", label: "Timeframe", type: "select", options: TIMEFRAMES, default: "1D" },
      { key: "capital", label: "Capital (USD)", type: "number", placeholder: "10000", default: "10000" },
      { key: "riskPerTrade", label: "Risk per trade (%)", type: "number", placeholder: "1-2", default: "1.5" },
    ],
  },
  {
    id: "backtesting",
    index: "02",
    title: "Backtesting",
    tagline: "Backtest a strategy against historical data with full metrics.",
    category: "Strategy",
    fields: [
      { key: "strategy", label: "Strategy rules", type: "textarea", placeholder: "Paste your entry/exit rules, indicators and parameters…", required: true },
      { key: "asset", label: "Asset / Market", type: "text", placeholder: "BTC-USD, SPY, EUR/USD…" },
      { key: "period", label: "Lookback period", type: "text", placeholder: "Last 5-10 years", default: "Last 5 years" },
    ],
  },
  {
    id: "risk-reward",
    index: "03",
    title: "Risk–Reward Analysis",
    tagline: "Break down a strategy's risk profile and how to improve it.",
    category: "Risk",
    fields: [
      { key: "strategy", label: "Strategy", type: "textarea", placeholder: "Describe the strategy to analyze…", required: true },
      { key: "riskPerTrade", label: "Risk per trade (%)", type: "number", placeholder: "1-2", default: "1.5" },
    ],
  },
  {
    id: "market-regime",
    index: "04",
    title: "Market Regime Detection",
    tagline: "Classify current conditions and recommend what to trade.",
    category: "Research",
    fields: [
      { key: "asset", label: "Asset", type: "text", placeholder: "BTC, SPX, Gold…", required: true },
      { key: "context", label: "Current context (optional)", type: "textarea", placeholder: "Recent price action, news, levels you're watching…" },
    ],
  },
  {
    id: "multi-factor",
    index: "05",
    title: "Multi-Factor Strategy",
    tagline: "Build a momentum / value / volatility / trend strategy.",
    category: "Strategy",
    fields: [
      { key: "assetClass", label: "Asset class", type: "select", options: MARKETS, default: "Stocks", required: true },
      { key: "factors", label: "Factors to combine", type: "text", placeholder: "Momentum, Value, Volatility, Trend", default: "Momentum, Value, Volatility, Trend" },
      { key: "universe", label: "Universe (optional)", type: "text", placeholder: "S&P 500, top 50 by market cap…" },
    ],
  },
  {
    id: "strategy-optimization",
    index: "06",
    title: "Strategy Optimization",
    tagline: "Increase Sharpe and reduce drawdown with before/after.",
    category: "Strategy",
    fields: [
      { key: "strategy", label: "Strategy rules", type: "textarea", placeholder: "Paste the strategy to optimize…", required: true },
      { key: "goals", label: "Optimization goals", type: "text", placeholder: "Increase Sharpe, reduce drawdown", default: "Increase Sharpe, reduce drawdown" },
    ],
  },
  {
    id: "portfolio-construction",
    index: "07",
    title: "Portfolio Construction",
    tagline: "Build a diversified portfolio with allocation and rationale.",
    category: "Portfolio",
    fields: [
      { key: "assets", label: "Assets", type: "textarea", placeholder: "List the assets to consider, one per line…", required: true },
      { key: "riskTolerance", label: "Risk tolerance", type: "select", options: RISK_LEVELS, default: "Medium" },
      { key: "horizon", label: "Time horizon", type: "text", placeholder: "1-3 years", default: "1-3 years" },
    ],
  },
  {
    id: "trade-setups",
    index: "08",
    title: "Trade Setup Generation",
    tagline: "3 high-probability setups with entries, stops and targets.",
    category: "Research",
    fields: [
      { key: "market", label: "Market", type: "select", options: MARKETS, default: "Crypto", required: true },
      { key: "conditions", label: "Current conditions", type: "textarea", placeholder: "Current price, key levels, trend, catalysts…", required: true },
    ],
  },
  {
    id: "monte-carlo",
    index: "09",
    title: "Monte Carlo Simulation",
    tagline: "Probability of loss, return distribution and robustness.",
    category: "Risk",
    fields: [
      { key: "strategy", label: "Strategy", type: "textarea", placeholder: "Describe the strategy and its historical stats (win rate, avg R, etc.)…", required: true },
      { key: "trades", label: "Simulated trades / runs", type: "number", placeholder: "1000", default: "1000" },
    ],
  },
  {
    id: "drawdown",
    index: "10",
    title: "Drawdown Analysis",
    tagline: "Max drawdown, recovery time and ways to reduce it.",
    category: "Risk",
    fields: [
      { key: "strategy", label: "Strategy", type: "textarea", placeholder: "Describe the strategy to analyze drawdowns for…", required: true },
    ],
  },
  {
    id: "macro-strategy",
    index: "11",
    title: "Macro-Based Strategy",
    tagline: "A strategy built on rates, inflation and growth.",
    category: "Research",
    fields: [
      { key: "assetClass", label: "Asset class", type: "select", options: MARKETS, default: "Stocks", required: true },
      { key: "indicators", label: "Macro indicators", type: "text", placeholder: "Interest rates, inflation, economic growth", default: "Interest rates, inflation, economic growth" },
    ],
  },
  {
    id: "alpha-detection",
    index: "12",
    title: "Alpha / Edge Detection",
    tagline: "Identify underexploited opportunities and how to capture them.",
    category: "Research",
    fields: [
      { key: "market", label: "Market", type: "select", options: MARKETS, default: "Crypto", required: true },
      { key: "focus", label: "Focus areas", type: "text", placeholder: "Behavioral inefficiencies, market structure gaps", default: "Behavioral inefficiencies, market structure gaps" },
    ],
  },
];

export const TOOLS_BY_ID: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.id, t]),
);
