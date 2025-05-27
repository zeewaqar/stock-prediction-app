import PredictionForm from '@/components/PredictionForm';
import PredictionHistory from '@/components/PredictionHistory';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-center">📈 Stock Prediction Dashboard</h1>

      {/* Stock Input + Chart + Prediction */}
      <PredictionForm />

      {/* Historical Predictions + Stats + Export */}
      <PredictionHistory />
    </main>
  );
}
