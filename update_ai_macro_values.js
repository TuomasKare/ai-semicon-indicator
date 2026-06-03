
const fs = require("fs");

// fetch Node-ympäristöön
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const INDICATORS_FILE = "ai_macro_indicators.json";
const OUTPUT_FILE = "ai_macro_values.json";

// Yahoo Finance fetch (5d momentum)
async function fetchYahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=1d`;

  const res = await fetch(url);
  const json = await res.json();

  const result = json.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const closes = result.indicators.quote[0].close.filter(v => v !== null);

  const first = closes[0];
  const last = closes[closes.length - 1];
  const change = ((last - first) / first) * 100;

  return {
    price: Number(last.toFixed(2)),
    change: Number(change.toFixed(2))
  };
}

async function run() {
  const raw = fs.readFileSync(INDICATORS_FILE, "utf8");
  const indicators = JSON.parse(raw);

  const values = {};
  const errors = [];

  for (const item of indicators) {
    const ticker = item.ticker;

    try {
      console.log(`Fetching ${ticker}...`);
      values[ticker] = await fetchYahoo(ticker);
    } catch (err) {
      console.error(`❌ ${ticker} failed`);
      errors.push(ticker);
    }
  }

  const output = {
    updated: new Date().toISOString(),
    values,
    failed: errors
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log("✅ ai_macro_values.json updated");
  if (errors.length) {
    console.log("⚠️ Failed tickers:", errors.join(", "));
  }
}

run();
