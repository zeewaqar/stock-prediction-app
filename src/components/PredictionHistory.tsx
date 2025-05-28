'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';

type Prediction = {
  id: string;
  symbol: string;
  datePredicted: string;
  predictedPrice: number;
  actualPrice: number | null;
};

export default function PredictionHistory() {
  const [data, setData] = useState<Prediction[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symbol, setSymbol] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const [mae, setMae] = useState<number | null>(null);
  const [mse, setMse] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });
    if (symbol) params.append('symbol', symbol);

    const res = await fetch(`/api/predictions?${params.toString()}`);
    const { predictions, total } = await res.json();

    setData(predictions);
    setTotal(total);

    const valid = predictions.filter((p: Prediction) => p.actualPrice !== null);
    const errors = valid.map((p: Prediction) => Math.abs(p.predictedPrice - p.actualPrice!));
    const sqErrors = valid.map((p: Prediction) => Math.pow(p.predictedPrice - p.actualPrice!, 2));
    const closeHits = valid.filter((p: Prediction) => Math.abs(p.predictedPrice - p.actualPrice!) <= 1);

    setMae(errors.length ? mean(errors) : null);
    setMse(sqErrors.length ? mean(sqErrors) : null);
    setAccuracy(valid.length ? (closeHits.length / valid.length) * 100 : null);
  }, [page, symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch('/api/predictions?page=1&limit=1000')
      .then(res => res.json())
      .then(({ predictions }) => {
        const symbols = Array.from<string>(new Set(predictions.map((p: Prediction) => p.symbol)));
        setSymbols(symbols);
      });
  }, []);

  const downloadCSV = () => {
    const header = 'Date,Symbol,Predicted,Actual,Error\n';
    const rows = data.map(p =>
      `${new Date(p.datePredicted).toLocaleDateString()},${p.symbol},${p.predictedPrice.toFixed(2)},${p.actualPrice ?? '—'},${p.actualPrice !== null ? Math.abs(p.predictedPrice - p.actualPrice).toFixed(2) : '—'}`
    );
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions_page${page}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 border rounded-lg mt-6">
      <h2 className="text-xl font-semibold mb-4">Prediction History</h2>

      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm">
          Filter by Symbol:
          <select
            value={symbol}
            onChange={(e) => {
              setSymbol(e.target.value);
              setPage(1);
            }}
            className="ml-2 border p-1 rounded text-sm"
          >
            <option value="">All</option>
            {symbols.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <button
          className="ml-auto bg-blue-500 text-white px-3 py-1 rounded text-sm"
          onClick={downloadCSV}
        >
          Export to CSV
        </button>
      </div>

      <div className="mb-4 space-y-1 text-sm">
        <p><strong>MAE:</strong> {mae?.toFixed(2) ?? '–'}</p>
        <p><strong>MSE:</strong> {mse?.toFixed(2) ?? '–'}</p>
        <p><strong>Accuracy (±1):</strong> {accuracy !== null ? `${accuracy.toFixed(1)}%` : '–'}</p>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Date</th>
              <th className="border p-2">Symbol</th>
              <th className="border p-2">Predicted</th>
              <th className="border p-2">Actual</th>
              <th className="border p-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {data.map(p => (
              <tr key={p.id}>
                <td className="border p-2">{new Date(p.datePredicted).toLocaleDateString()}</td>
                <td className="border p-2">{p.symbol}</td>
                <td className="border p-2">{p.predictedPrice.toFixed(2)}</td>
                <td className="border p-2">{p.actualPrice !== null ? p.actualPrice.toFixed(2) : '—'}</td>
                <td className="border p-2">{p.actualPrice !== null ? Math.abs(p.predictedPrice - p.actualPrice).toFixed(2) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between text-sm">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage(p => (p * pageSize < total ? p + 1 : p))}
          disabled={page * pageSize >= total}
          className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <Button
        variant="destructive"
        onClick={async () => {
          const res = await fetch("/api/admin/clear", {method: "POST"});
          const result = await res.json();
          if (result.success) {
            setData([]);
            setTotal(0);
            setMae(null);
            setMse(null);
            setAccuracy(null);
            setSymbol('');
            setSymbols([]);
            setPage(1);
            
            alert("Predictions cleared!");
          } else {
            alert(result.error || "Failed to clear predictions");
          }
        }}>
        Clear Predictions
      </Button>
    </div>
  );
}
