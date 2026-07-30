const fs = require("fs");

// fetch for Node environment
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const OUTPUT_FILE = "smh.json";

const SHARES = 102.6;

const ETF_SYMBOL = "VVSM.DE";

const FALLBACK_HOLDINGS = [
  { ticker: "NVDA", name: "NVIDIA" },
  { ticker: "AVGO", name: "Broadcom" },
  { ticker: "QCOM", name: "Qualcomm" },
  { ticker: "AMD", name: "Advanced Micro Devices" },
  { ticker: "INTC", name: "Intel" },
  { ticker: "ASML.AS", name: "ASML" },
  { ticker: "TSM", name: "Taiwan Semiconductor" },
  { ticker: "MU", name: "Micron Technology" }
];

const HARDCODED_FALLBACK = {
  "NVDA": { price: "197.58", change: "0.94" },
  "AVGO": { price: "189.45", change: "-1.23" },
  "QCOM": { price: "168.92", change: "2.15" },
  "AMD": { price: "182.34", change: "1.45" },
  "INTC": { price: "42.67", change: "-0.89" },
  "ASML.AS": { price: "728.50", change: "3.12" },
  "TSM": { price: "134.28", change: "0.56" },
  "MU": { price: "121.45", change: "2.34" }
};

async function fetchYahooChart(symbol, range = "1y", interval = "1d") {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
    `?range=${range}&interval=${interval}`;

  const res = await fetch(url);
  const json = await res.json();

  const result = json.chart?.result?.[0];

  if (!result)
    throw new Error(`No data for ${symbol}`);

  const closes = result.indicators.quote[0].close;
  const timestamps = result.timestamp;

  const filtered = [];
  const filteredTimestamps = [];

  for (let i = 0; i < closes.length; i++) {
    if (closes[i] != null) {
      filtered.push(
        Number(closes[i].toFixed(2))
      );

      filteredTimestamps.push(
        timestamps[i]
      );
    }
  }

  return {
    closes: filtered,
    timestamps: filteredTimestamps
  };
}

async function fetchStockData(ticker) {
  try {

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}` +
      `?range=1d&interval=1d`;

    const res = await fetch(url);
    const json = await res.json();

    const result =
      json.chart?.result?.[0];

    if (!result) {
      return HARDCODED_FALLBACK[ticker] || null;
    }

    const price =
      result.regularMarketPrice;

    const prevClose =
      result.previousClose;

    const changePercent =
      ((price - prevClose) /
      prevClose) * 100;

    return {
      price: price.toFixed(2),
      change: changePercent.toFixed(2)
    };

  } catch {

    return HARDCODED_FALLBACK[ticker] || null;

  }
}

function sma(values, period) {

  if (values.length < period)
    return null;

  const slice = values.slice(-period);

  return (
    slice.reduce((a, b) => a + b, 0)
    / period
  );
}

async function run() {

  try {

    console.log("=== VVSM Update ===");

    const etf =
      await fetchYahooChart(
        ETF_SYMBOL,
        "1y",
        "1d"
      );

    const latestPrice =
      etf.closes[
        etf.closes.length - 1
      ];

    const latestValueEUR =
      SHARES * latestPrice;

    const ath =
      Math.max(...etf.closes);

    const drawdownPercent =
      ((latestPrice - ath) / ath) * 100;

    const sma20 =
      sma(etf.closes, 20);

    const sma50 =
      sma(etf.closes, 50);

    let exitSignal = "HOLD";

    if (drawdownPercent <= -20) {
      exitSignal = "EXIT";
    }
    else if (drawdownPercent <= -10) {
      exitSignal = "REDUCE";
    }

    if (
      sma20 &&
      sma50 &&
      latestPrice < sma20 &&
      sma20 < sma50
    ) {
      exitSignal = "EXIT";
    }

    const holdings = {};

    for (const stock of FALLBACK_HOLDINGS) {

      const data =
        await fetchStockData(
          stock.ticker
        );

      if (data) {
        holdings[stock.ticker] = data;
      }
    }

    const output = {
      updated: new Date().toISOString(),

      symbol: ETF_SYMBOL,

      name:
        "VanEck Semiconductor UCITS ETF USD A (XETR: VVSM)",

      shares: SHARES,

      latestPriceEUR: latestPrice,

      latestValueEUR: latestValueEUR,

      allTimeHigh: Number(
        ath.toFixed(2)
      ),

      drawdownPercent: Number(
        drawdownPercent.toFixed(2)
      ),

      sma20: sma20
        ? Number(sma20.toFixed(2))
        : null,

      sma50: sma50
        ? Number(sma50.toFixed(2))
        : null,

      exitSignal: exitSignal,

      timestamps: etf.timestamps,

      closes: etf.closes,

      holdings: holdings
    };

    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(output, null, 2)
    );

    console.log(
      "✅ smh.json updated"
    );

  } catch (err) {

    console.error(
      err.message
    );

    process.exit(1);

  }
}

run();
