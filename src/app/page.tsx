import Link from 'next/link';
import PredictionForm from '@/components/PredictionForm';
import PredictionHistory from '@/components/PredictionHistory';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-center">📈 Stock Prediction Dashboard</h1>

      {/* Navigation Links */}
      <div className="flex justify-center gap-6 mb-8">
        <Link
          href="/dashboard"
          className="text-blue-600 hover:underline font-medium"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/update-actuals"
          className="text-blue-600 hover:underline font-medium"
        >
          Admin: Update Actuals
        </Link>
      </div>

      {/* Stock Input + Chart + Prediction */}
      <PredictionForm />

      {/* Historical Predictions + Stats + Export */}
      <PredictionHistory />
    </main>
  );
}
