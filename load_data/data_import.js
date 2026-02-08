import Papa from "papaparse";
import { createChart } from "lightweight-charts";

const chart = createChart(document.body, {
  width: 900,
  height: 500,
});

const candleSeries = chart.addCandlestickSeries();

function loadCSV(file) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const candles = results.data.map(row => ({
        time: new Date(row.Datetime).toISOString(),
        open: Number(row.Open),
        high: Number(row.High),
        low: Number(row.Low),
        close: Number(row.Close),
      }));

      candleSeries.setData(candles);
    }
  });
}

document
  .querySelector("#csvInput")
  .addEventListener("change", (e) => {
    loadCSV(e.target.files[0]);
});

