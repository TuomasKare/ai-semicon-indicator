const fs = require("fs");

// fetch for Node environment
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const OUTPUT_FILE = "smh.json";
const SHARES = "102.6"; // your owned VVSM shares

// Yahoo symbol for XETR: VVSM is VVSM.DE (priced in EUR)
const ETF_SYMBOL = "VVSM.DE";

// Fallback VVSM holdings (used if API fetch fails)
const FALLBACK_HOLDINGS = [
  { ticker: "NVDA", name: "NVIDIA" },
  { ticker: "BROADCOM", name: "Broadcom" },
  { ticker: "QCOM", name: "Qualcomm" },
  { ticker: "AMD", name: "Advanced Micro Devices" },
  { ticker: "INTC", name: "Intel" },
  { ticker: "ASML", name: "ASML" },
  { ticker: "TSM", name: "Taiwan Semiconductor" },
  { ticker: "MU", name: "Micron Technology" }
];

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

async function fetchETFHoldings(etfSymbol) {
  try {
    console.log(`Fetching ${etfSymbol} holdings...`);
    
    // Try to fetch from Yahoo Finance holdings endpoint
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${etfSymbol}?modules=holdings`;
    const res = await fetch(url);
    const json = await res.json();
    
    // Navigate the API response carefully
    const holdingsData = json?.quoteSummary?.result?.[0]?.holdings?.holdings;
    
    if (holdingsData && Array.isArray(holdingsData) && holdingsData.length > 0) {
      // Extract ticker symbols from holdings
      const topHoldings = holdingsData.slice(0, 10).map(holding => ({
        ticker: holding.symbol,
        name: holding.symbol
      }));

      console.log(`✅ Fetched ${topHoldings.length} holdings from Yahoo Finance`);
      return topHoldings;
    } else {
      throw new Error("No holdings data in response");
    }
  } catch (err) {
    console.warn(`⚠️  Could not fetch holdings from Yahoo Finance: ${err.message}`);
    console.log(`Using ${FALLBACK_HOLDINGS.length} fallback holdings...`);
    return FALLBACK_HOLDINGS;
  }
}

async function fetchStockData(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1d`;
    const res = await fetch(url);
    const json = await res.json();
    const result = json.chart?.result?.[0];
    if (!result) return null;

    const price = result.regularMarketPrice;
    const prevClose = result.previousClose;
    const change = price - prevClose;
    const changePercent = (change / prevClose * 100);

    return {
      price: price.toFixed(2),
      change: changePercent.toFixed(2)
    };
  } catch (err) {
    console.warn(`Could not fetch ${ticker}:`, err.message);
    return null;
  }
}

async function run() {
  try {
    console.log(`Fetching ${ETF_SYMBOL} history...`);
    const etf = await fetchYahooChart(ETF_SYMBOL, "1mo", "1d");

    const latestPrice = etf.closes[etf.closes.length - 1];
    const latestValueEur = SHARES * latestPrice;

    // Dynamically fetch VVSM holdings
    const vvsmHoldings = await fetchETFHoldings("VVSM");

    // Fetch stock data for each holding
    console.log("Fetching holdings stock prices...");
    const holdings = {};
    for (const stock of vvsmHoldings) {
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
    console.log("✅ smh.json updated successfully");
    console.log(
      `Latest VVSM: €${latestPrice.toFixed(2)}, Position: €${latestValueEur.toFixed(2)}`
    );
    console.log(`Holdings updated: ${Object.keys(holdings).length} stocks`);
  } catch (err) {
    console.error("❌ Failed to update VVSM data:", err.message);
  }
}

run();
