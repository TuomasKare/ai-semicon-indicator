const fs = require("fs");

// fetch for Node environment
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const OUTPUT_FILE = "smh.json";
const SHARES = 1026; // your owned VVSM shares

// Yahoo symbol for XETR: VVSM is VVSM.DE (priced in EUR)
const ETF_SYMBOL = "VVSM.DE";

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

async function run() {
  try {
    console.log(`Fetching ${ETF_SYMBOL} history...`);
    const etf = await fetchYahooChart(ETF_SYMBOL, "1mo", "1d");

    const latestPrice = etf.closes[etf.closes.length - 1];
    const latestValueEur = SHARES * latestPrice;

    const output = {
      updated: new Date().toISOString(),
      symbol: ETF_SYMBOL,
      name: "VanEck Semiconductor UCITS ETF USD A (XETR: VVSM)",
      shares: SHARES,
      latestPriceEUR: latestPrice,
      latestValueEUR: latestValueEur,
      timestamps: etf.timestamps,
      closes: etf.closes
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log("✅ smh.json updated");
    console.log(
      `Latest VVSM: €${latestPrice.toFixed(2)}, Position: €${latestValueEur.toFixed(2)}`
    );
  } catch (err) {
    console.error("❌ Failed to update VVSM data:", err.message);
  }
}

run();
