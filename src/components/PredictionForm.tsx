'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StockChart from '@/components/StockChart';
import ForecastTable from '@/components/ForecastTable';

type PriceData = { date: string; price: number };
type ForecastEntry = { date: string; predictedPrice: number };

export default function PredictionForm() {
  const [symbol, setSymbol] = useState('');
  const [chartData, setChartData] = useState<PriceData[]>([]);
  const [forecast, setForecast] = useState<ForecastEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePredict = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch stock prices
      const res = await fetch('/api/stocks', {
        method: 'POST',
        body: JSON.stringify({ symbol }),
      });
      const stockData = await res.json();
      const series = stockData['Time Series (Daily)'];

      const prices = Object.entries(series)
        .slice(0, 30)
        .map(([date, info]) => ({
          date,
          price: parseFloat((info as { '4. close': string })['4. close']),
        }))
        .reverse();

      setChartData(prices);

      // 2. Predict 7-day forecast
      const predictRes = await fetch('/api/predict', {
        method: 'POST',
        body: JSON.stringify({ symbol, prices }),
      });

      if (!predictRes.ok) {
        const { error } = await predictRes.json();
        setErrorMsg(error ?? 'Prediction failed');
        setForecast([]);
        return;
      }

      const { forecast } = await predictRes.json();
      setForecast(forecast);
    } catch {
      setErrorMsg('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-xl font-semibold mb-4">📈 Stock Prediction</h2>

      <div className="flex flex-col gap-3">
        <Input
          placeholder="Enter stock symbol (e.g., AAPL)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        />
        <Button onClick={handlePredict} disabled={loading}>
          {loading ? 'Predicting...' : 'Predict'}
        </Button>

        {errorMsg && (
          <p className="text-sm text-red-500">{errorMsg}</p>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="mt-6">
          <StockChart data={chartData} />
        </div>
      )}

      {forecast.length > 0 && (
        <div className="mt-6">
          <ForecastTable forecast={forecast} />
        </div>
      )}
    </div>
  );
}
