// Server-only prompt engine. This is the product's core IP — it is never sent
// to the browser. Each tool maps a set of user inputs to a tightly-specified
// instruction for the model. A shared system prompt establishes the analyst
// persona, the output contract, and the compliance framing.

import { TOOLS_BY_ID } from "../shared/catalog.js";

type Inputs = Record<string, string>;

/** Pull an input with a fallback so prompts never contain raw "undefined". */
function v(inputs: Inputs, key: string, fallback = "not specified"): string {
  const raw = (inputs[key] ?? "").trim();
  return raw.length ? raw : fallback;
}

export const SYSTEM_PROMPT = `You are a senior quantitative analyst and portfolio strategist with the rigor of a top hedge fund research desk. You produce institutional-grade market analysis that is specific, structured, and actionable.

Operating rules:
- Be concrete. Give exact parameters, formulas, numeric ranges, and step-by-step logic rather than vague generalities.
- Format every response in clean Markdown: clear section headings, bullet lists, and Markdown tables where they aid comparison.
- State the assumptions and market conditions under which an idea works — and where it breaks.
- Quantify risk wherever possible (e.g. expected drawdown, Sharpe, win rate, R-multiples).
- Never claim certainty about future returns. Frame everything as analysis and scenarios, not promises.
- You do not have live market data. When current prices or fresh data are relevant, reason from the user's stated context and clearly label any figures as illustrative.

End EVERY response with this exact line on its own:

> _Educational analysis only — not financial advice. Markets carry risk of loss. Do your own research._`;

/** Builds the user-message prompt for a given tool id + inputs. */
export function buildPrompt(toolId: string, inputs: Inputs): string {
  switch (toolId) {
    case "strategy-generation":
      return `Act as a hedge fund quant. Generate 3 distinct, profitable trading strategies for the ${v(inputs, "market")} market.

Constraints:
- Timeframe: ${v(inputs, "timeframe")}
- Capital: $${v(inputs, "capital")}
- Risk per trade: ${v(inputs, "riskPerTrade")}%

For EACH strategy, provide:
1. Indicators used, with exact settings
2. Entry & exit rules, step by step
3. Stop-loss & take-profit logic
4. Market conditions where it works best
5. Why this strategy has an edge`;

    case "backtesting":
      return `Backtest the following trading strategy using historical data.

Strategy rules:
${v(inputs, "strategy")}

Asset / market: ${v(inputs, "asset")}
Lookback period: ${v(inputs, "period")}

Requirements:
- Metrics: CAGR, Sharpe ratio, max drawdown, win rate, profit factor, average R
- Output a results table plus a written summary
Also explain:
- When the strategy performs best and worst
- What market conditions break it`;

    case "risk-reward":
      return `Analyze this strategy's risk–reward profile.

Strategy:
${v(inputs, "strategy")}

Assumed risk per trade: ${v(inputs, "riskPerTrade")}%

Break down:
- Risk per trade and position sizing
- Reward-to-risk ratio
- Drawdown patterns to expect

Then:
- Suggest 3 improvements to reduce risk
- Suggest 2 ways to increase returns WITHOUT increasing risk`;

    case "market-regime":
      return `Analyze current market conditions for ${v(inputs, "asset")}.

${inputs.context?.trim() ? `Context provided by the trader:\n${inputs.context.trim()}\n` : ""}
Identify:
- Trend (bull / bear / sideways)
- Volatility level
- Volume behavior

Then recommend:
- The best strategy type for this environment
- What to avoid right now`;

    case "multi-factor":
      return `Create a multi-factor trading strategy for ${v(inputs, "assetClass")} using these factors: ${v(inputs, "factors")}.
${inputs.universe?.trim() ? `Investable universe: ${inputs.universe.trim()}` : ""}

Include:
- Exact formula / logic for each factor
- Weight allocation (%) across factors
- Rebalancing frequency
- An example portfolio with sample holdings`;

    case "strategy-optimization":
      return `Optimize this trading strategy.

Strategy:
${v(inputs, "strategy")}

Goals: ${v(inputs, "goals")}

Improve:
- Indicator settings
- Entry / exit timing
- Filters (trend / volume / volatility)

Show a clear BEFORE vs AFTER comparison (table) and explain each change.`;

    case "portfolio-construction":
      return `Build a diversified portfolio from these assets:
${v(inputs, "assets")}

Constraints:
- Risk tolerance: ${v(inputs, "riskTolerance")}
- Time horizon: ${v(inputs, "horizon")}

Output:
- Allocation % per asset (table)
- Expected return and risk (volatility, drawdown) per asset
Also explain why each asset is included and how they diversify each other.`;

    case "trade-setups":
      return `Based on the current conditions below, generate 3 high-probability trade setups for the ${v(inputs, "market")} market.

Current conditions:
${v(inputs, "conditions")}

For EACH trade include:
- Entry price (or trigger)
- Stop-loss
- Take-profit target(s)
- Risk/reward ratio
- Reasoning (technical + macro)`;

    case "monte-carlo":
      return `Run a Monte Carlo simulation on this strategy.

Strategy and stats:
${v(inputs, "strategy")}

Number of simulated runs: ${v(inputs, "trades")}

Show:
- Probability of loss
- Return distribution (describe percentiles: p5, p25, median, p75, p95)
- Worst-case scenarios

Then explain whether the strategy is robust or fragile, and why.`;

    case "drawdown":
      return `Analyze the drawdowns of this strategy.

Strategy:
${v(inputs, "strategy")}

Provide:
- Maximum drawdown (estimate with reasoning)
- Average recovery time

Then suggest:
- 3 ways to reduce drawdowns
- Position-sizing improvements`;

    case "macro-strategy":
      return `Create a trading strategy for ${v(inputs, "assetClass")} using macro indicators: ${v(inputs, "indicators")}.

Explain:
- How each macro factor affects trades
- Concrete entry / exit signals derived from each factor
- Example trades that illustrate the strategy`;

    case "alpha-detection":
      return `Identify underexploited opportunities in the ${v(inputs, "market")} market.

Focus on: ${v(inputs, "focus")}

Then propose:
- 2 unique strategies that exploit these inefficiencies
- Why most traders miss them
- How to execute them, step by step`;

    default:
      throw new Error(`Unknown tool: ${toolId}`);
  }
}

/** Lightweight validation: tool exists and required fields are present. */
export function validateRequest(toolId: string, inputs: Inputs): string | null {
  const tool = TOOLS_BY_ID[toolId];
  if (!tool) return `Unknown tool: ${toolId}`;
  for (const field of tool.fields) {
    if (field.required && !(inputs[field.key] ?? "").trim()) {
      return `Missing required field: ${field.label}`;
    }
  }
  return null;
}
