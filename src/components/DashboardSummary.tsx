'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox'; // using shadcn combobox

type Entry = {
  id?: string;
  symbol?: string;
  date: string;
  predictedPrice: number;
  actualPrice: number | null;
  datePredicted?: string;
};

export default function DashboardSummary() {
  const [data, setData] = useState<Entry[]>([]);
  const [symbol, setSymbol] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const [metrics, setMetrics] = useState({
    mae: 0,
    mse: 0,
    accuracy: 0,
    total: 0,
  });
  const [symbolStats, setSymbolStats] = useState<
    Record<string, { total: number; mae: number; mse: number; accuracy: number }>
  >({});

  useEffect(() => {
    fetch('/api/symbols')
      .then(res => res.json())
      .then(setAllSymbols);
  }, []);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/predictions?limit=1000${symbol ? `&symbol=${symbol}` : ''}`);
      const { predictions } = await res.json();

      const filtered = predictions.filter((p: Entry) => {
        const date = p.datePredicted?.slice(0, 10);
        return (!startDate || date! >= startDate) && (!endDate || date! <= endDate);
      });

      const valid = filtered.filter((p: Entry) => p.actualPrice !== null);
      const errors = valid.map((p: Entry) => Math.abs(p.predictedPrice - (p.actualPrice as number)));
      const sqErrors = valid.map((p: Entry) => Math.pow(p.predictedPrice - (p.actualPrice as number), 2));
      const closeHits = valid.filter((p: Entry) => Math.abs(p.predictedPrice - (p.actualPrice as number)) <= 1);

      setMetrics({
        mae: errors.length ? average(errors) : 0,
        mse: sqErrors.length ? average(sqErrors) : 0,
        accuracy: valid.length ? (closeHits.length / valid.length) * 100 : 0,
        total: filtered.length,
      });

      setData(filtered.map((p: Entry) => ({
        date: new Date(p.datePredicted ?? '').toISOString().slice(0, 10),
        predictedPrice: p.predictedPrice,
        actualPrice: p.actualPrice,
        symbol: p.symbol,
      })));

      const grouped: Record<string, Entry[]> = {};
      filtered.forEach(p => {
        if (!grouped[p.symbol!]) grouped[p.symbol!] = [];
        grouped[p.symbol!].push(p);
      });

      const stats: typeof symbolStats = {};
      Object.entries(grouped).forEach(([symbol, entries]) => {
        const valid = entries.filter(p => p.actualPrice !== null);
        const errs = valid.map(p => Math.abs(p.predictedPrice - (p.actualPrice as number)));
        const sqs = valid.map(p => Math.pow(p.predictedPrice - (p.actualPrice as number), 2));
        const accs = valid.filter(p => Math.abs(p.predictedPrice - (p.actualPrice as number)) <= 1);

        stats[symbol] = {
          total: entries.length,
          mae: errs.length ? average(errs) : 0,
          mse: sqs.length ? average(sqs) : 0,
          accuracy: valid.length ? (accs.length / valid.length) * 100 : 0,
        };
      });

      setSymbolStats(stats);
    };

    load();
    const interval = setInterval(load, 60000); // auto-refresh every 60s
    return () => clearInterval(interval);
  }, [symbol, startDate, endDate]);

  const average = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const handleExport = () => {
    const header = 'Date,Symbol,Predicted,Actual\n';
    const rows = data.map((d) =>
      `${d.date},${d.symbol},${d.predictedPrice.toFixed(2)},${d.actualPrice ?? '—'}`
    );
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast_${symbol || 'all'}_${startDate || 'all'}-${endDate || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📊 Forecast Accuracy Dashboard</h1>

      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <Combobox
          options={allSymbols}
          value={symbol}
          onValueChange={(v) => setSymbol(v)}
          placeholder="Select symbol"
          className="w-40"
        />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-40"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-40"
        />
        <Button onClick={handleExport} className="ml-auto">
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm mb-6">
        <div className="bg-gray-100 p-4 rounded">
          <p className="text-gray-600">Total Predictions</p>
          <p className="text-xl font-semibold">{metrics.total}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <p className="text-gray-600">MAE</p>
          <p className="text-xl font-semibold">{metrics.mae.toFixed(2)}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <p className="text-gray-600">MSE</p>
          <p className="text-xl font-semibold">{metrics.mse.toFixed(2)}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <p className="text-gray-600">Accuracy (±1)</p>
          <p className="text-xl font-semibold">{metrics.accuracy.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">📈 Predicted vs Actual Prices</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="predictedPrice"
              name="Predicted"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actualPrice"
              name="Actual"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {Object.keys(symbolStats).length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">📈 Per-Symbol Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(symbolStats).map(([symbol, stat]) => (
              <div key={symbol} className="border p-4 rounded shadow-sm bg-gray-50">
                <h4 className="font-bold text-lg mb-2">{symbol}</h4>
                <p className="text-sm">Total: {stat.total}</p>
                <p className="text-sm">MAE: {stat.mae.toFixed(2)}</p>
                <p className="text-sm">MSE: {stat.mse.toFixed(2)}</p>
                <p className="text-sm">Accuracy ±1: {stat.accuracy.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
