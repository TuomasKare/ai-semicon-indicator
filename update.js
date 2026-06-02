const fs = require("fs");

async function fetchYahoo(symbol){
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=1d`;
    const res = await fetch(url);
    const data = await res.json();

    const prices = data.chart.result[0].indicators.quote[0].close.filter(p => p !== null);

    const first = prices[0];
    const last = prices[prices.length - 1];

    const change = ((last - first) / first) * 100;

    return {
        price: last,
        change: change
    };
}

async function run(){

    const nvda = await fetchYahoo("NVDA");
    const soxx = await fetchYahoo("SOXX");
    const vix = await fetchYahoo("^VIX");
    const oil = await fetchYahoo("CL=F");

    const output = {
        nvda: nvda.price.toFixed(2),
        nvdaChange: nvda.change.toFixed(2),

        soxx: soxx.price.toFixed(2),
        soxxChange: soxx.change.toFixed(2),

        vix: parseFloat(vix.price.toFixed(2)),
        oil: parseFloat(oil.price.toFixed(2)),

        updated: new Date().toISOString()
    };

    fs.writeFileSync("data.json", JSON.stringify(output, null, 2));

    console.log("Updated data.json");
}

run();
