type ForecastEntry = {
    date: string;
    predictedPrice: number;
  };
  
  export default function ForecastTable({ forecast }: { forecast: ForecastEntry[] }) {
    return (
      <div className="mt-6 border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">📊 7-Day Forecast</h3>
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Predicted Price</th>
            </tr>
          </thead>
          <tbody>
            {forecast.map((f) => (
              <tr key={f.date}>
                <td className="border p-2">{new Date(f.date).toLocaleDateString()}</td>
                <td className="border p-2">${f.predictedPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  