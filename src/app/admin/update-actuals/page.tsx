'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type PendingPrediction = {
  id: string;
  symbol: string;
  datePredicted: string;
  predictedPrice: number;
  actualPrice: number | null;
};

export default function UpdateActualsAdminPage() {
  const [data, setData] = useState<PendingPrediction[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch('/api/predictions?limit=1000')
      .then(res => res.json())
      .then(({ predictions }) => {
        const missing = predictions.filter((p: PendingPrediction) => p.actualPrice === null);
        setData(missing);
      });
  }, []);

  const handleSubmit = async () => {
    const payload = Object.entries(inputs)
      .filter(([, v]) => v.trim() !== '')
      .map(([id, value]) => ({ id, actualPrice: parseFloat(value) }));

    const res = await fetch('/api/update-actuals-manual', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSuccessMsg(`✅ Updated ${payload.length} entries.`);
      setInputs({});
      setData((prev) => prev.filter(p => !payload.some(up => up.id === p.id)));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">🛠️ Manually Update Actual Prices</h2>

      {successMsg && <p className="mb-4 text-green-600 text-sm">{successMsg}</p>}

      <div className="overflow-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Date</th>
              <th className="border p-2">Symbol</th>
              <th className="border p-2">Predicted</th>
              <th className="border p-2">Actual</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td className="border p-2">{new Date(p.datePredicted).toLocaleDateString()}</td>
                <td className="border p-2">{p.symbol}</td>
                <td className="border p-2">${p.predictedPrice.toFixed(2)}</td>
                <td className="border p-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={inputs[p.id] || ''}
                    onChange={(e) => setInputs({ ...inputs, [p.id]: e.target.value })}
                    placeholder="Enter actual"
                    className="w-28"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button className="mt-4" onClick={handleSubmit}>
        Save Updates
      </Button>
    </div>
  );
}
