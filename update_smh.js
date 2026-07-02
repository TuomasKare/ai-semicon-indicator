const fs = require("fs");

// fetch for Node environment
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const OUTPUT_FILE = "smh.json";
const SHARES = "102.6"; // your owned VVSM shares

// Yahoo symbol for XETR: VVSM is VVSM.DE (priced in EUR)
const ETF_SYMBOL = "VVSM.DE";

// Fallback VVSM holdings with proper ticker formats for Yahoo Finance
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

// Hardcoded fallback data if API completely fails
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

async function fetchYahooChart(symbol, range = "1mo", interval = "1d") {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
  const res = await fetch(url);
  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const closes = result.indicators.quote[0].close;
  const timestamps = result.timestamp;

  const filtered = [];
  const filteredTimestamps = [];
  for (let i = 0; i < closes.length; i++) {
    if (closes[i] != null) {
      filtered.push(Number(closes[i].toFixed(2)));
      filteredTimestamps.push(timestamps[i]);
    }
  }

  return {
    closes: filtered,
    timestamps: filteredTimestamps
  };
}

async function fetchStockData(ticker) {
  try {
    console.log(`Fetching ${ticker}...`);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1d`;
    const res = await fetch(url);
    const json = await res.json();
    const result = json.chart?.result?.[0];
    
    if (!result) {
      console.warn(`  ⚠️  No data for ${ticker}, using fallback`);
      return HARDCODED_FALLBACK[ticker] || null;
    }

    const price = result.regularMarketPrice;
    const prevClose = result.previousClose;
    const change = price - prevClose;
    const changePercent = (change / prevClose * 100);

    const data = {
      price: price.toFixed(2),
      change: changePercent.toFixed(2)
    };
    console.log(`  ✅ ${ticker}: $${data.price} (${data.change}%)`);
    return data;
  } catch (err) {
    console.warn(`  ⚠️  Error fetching ${ticker}: ${err.message}, using fallback`);
    return HARDCODED_FALLBACK[ticker] || null;
  }
}

async function run() {
  try {
    console.log(`\n=== VVSM Holdings Update ===`);
    console.log(`Fetching ${ETF_SYMBOL} history...`);
    const etf = await fetchYahooChart(ETF_SYMBOL, "1mo", "1d");

    const latestPrice = etf.closes[etf.closes.length - 1];
    const latestValueEur = SHARES * latestPrice;

    console.log(`Latest VVSM price: €${latestPrice.toFixed(2)}`);
    console.log(`Your position: €${latestValueEur.toFixed(2)}\n`);

    console.log(`Fetching holdings stock prices...`);
    const holdings = {};
    
    for (const stock of FALLBACK_HOLDINGS) {
      const data = await fetchStockData(stock.ticker);
      if (data) {
        holdings[stock.ticker] = data;
      }
    }

    const output = {
      updated: new Date().toISOString(),
      symbol: ETF_SYMBOL,
      name: "VanEck Semiconductor UCITS ETF USD A (XETR: VVSM)",
      shares: SHARES,
      latestPriceEUR: latestPrice,
      latestValueEUR: latestValueEur,
      timestamps: etf.timestamps,
      closes: etf.closes,
      holdings: holdings
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`\n✅ smh.json updated successfully`);
    console.log(`Holdings count: ${Object.keys(holdings).length} stocks`);
    console.log(`=== Update Complete ===\n`);
  } catch (err) {
    console.error("❌ Failed to update VVSM data:", err.message);
    process.exit(1);
  }
}

run();
