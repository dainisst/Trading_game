import { createChart } from "lightweight-charts";

// Function to parse datetime string to timestamp
function parseDateTime(datetimeStr) {
  // Handle format: "2026-02-01 18:10:00-05:00"
  // Replace the timezone with 'Z' to treat it as UTC
  const utcDateStr = datetimeStr.replace(/-05:00$/, 'Z');
  return Math.floor(new Date(utcDateStr).getTime() / 1000);
}

// Function to update status message
function updateStatus(message, isError = false) {
  const statusElement = document.getElementById('status-message');
  statusElement.textContent = message;
  statusElement.className = isError ? 'error' : 'success';
}

// Main function to load and process data
async function loadAndVisualizeData() {
  try {
    updateStatus('Loading data...');

    // Load the CSV file
    const response = await fetch('data.csv');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.text();

    // Parse CSV data
    const rows = data.split('\n');
    const stockData = [];

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim();
      if (!row) continue;

      const values = row.split(',');
      if (values.length < 6) continue; // We need at least 6 columns (including volume)

      try {
        const time = parseDateTime(values[0]);
        const open = parseFloat(values[1]);
        const high = parseFloat(values[2]);
        const low = parseFloat(values[3]);
        const close = parseFloat(values[4]);
        const volume = parseInt(values[5]) || 0;

        // Validate numeric values
        if ([time, open, high, low, close].some(isNaN)) continue;

        stockData.push({ time, open, high, low, close, volume });
      } catch (e) {
        console.warn(`Error parsing row ${i}:`, e);
        continue;
      }
    }

    if (stockData.length === 0) {
      throw new Error("No valid data found in the CSV file");
    }

    // Create chart using the global LightweightCharts variable
    const chart = createChart(
      document.getElementById('chart-container'),
      {
        layout: {
          background: { type: 'solid', color: 'white' },
          textColor: 'black',
        },
        grid: {
          vertLines: { color: 'rgba(197, 203, 206, 0.5)' },
          horzLines: { color: 'rgba(197, 203, 206, 0.5)' },
        },
        width: document.getElementById('chart-container').clientWidth,
        height: 500,
      }
    );

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candlestickSeries.setData(stockData);

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volumeSeries.setData(stockData.map(item => ({
      time: item.time,
      value: item.volume,
      color: item.close > item.open ? '#26a69a' : '#ef5350',
    })));

    // Configure price scale
    chart.priceScale('right').applyOptions({
      scaleMargins: {
        top: 0.1,
        bottom: 0.2,
      },
    });

    // Make chart responsive
    window.addEventListener('resize', () => {
      chart.applyOptions({
        width: document.getElementById('chart-container').clientWidth
      });
    });

    updateStatus(`Successfully loaded ${stockData.length} data points`);
  } catch (error) {
    console.error('Error:', error);
    updateStatus(`Error: ${error.message}`, true);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadAndVisualizeData);
