const fetch = require("node-fetch");
const fs = require("fs");

async function fetchData(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5d&interval=1d`;

  const res = await fetch(url);
  const json = await res.json();

  const prices = json.chart.result[0].indicators.quote[0].close.filter(v => v !== null);

  const first = prices[0];
  const last = prices[prices.length - 1];

  const change = ((last - first) / first) * 100;

  return {
    price: last,
    change: change
  };
}

function calculateScore(data) {
  const soxx = data.soxxChange > 0 ? 1 : -1;
  const nvda = data.nvdaChange > 5 ? -1 : 1;
  const vix = data.vix > 25 ? -1 : 0;
  const oil = data.oil > 95 ? -0.5 : 0;

  const score =
    0.4 * soxx +
    0.3 * nvda +
    0.2 * vix +
    0.1 * oil;

  return score;
}

function appendHistory(entry) {
  let history = [];

  try {
    history = JSON.parse(fs.readFileSync("history.json"));
  } catch (e) {
    history = [];
  }

  history.push(entry);

  // keep max 200 entries
  if (history.length > 200) {
    history.shift();
  }

  fs.writeFileSync("history.json", JSON.stringify(history, null, 2));
}

async function run() {
  const nvda = await fetchData("NVDA");
  const soxx = await fetchData("SOXX");
  const vix = await fetchData("^VIX");
  const oil = await fetchData("CL=F");

  const data = {
    timestamp: new Date().toISOString(),

    nvda: nvda.price,
    nvdaChange: nvda.change,

    soxx: soxx.price,
    soxxChange: soxx.change,

    vix: vix.price,
    oil: oil.price
  };

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

  const score = calculateScore(data);

  // ✅ NEW: store score history
  appendHistory({
    timestamp: data.timestamp,
    coreScore: score
  });

  console.log("Update complete");
}

run();
