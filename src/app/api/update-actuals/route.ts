import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const ALPHA_API_KEY = process.env.ALPHA_API_KEY;

async function fetchActualPrice(symbol: string, date: string): Promise<number | null> {
  const res = await fetch(
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_API_KEY}`
  );

  const data = await res.json();
  const series = data['Time Series (Daily)'];

  const entry = series?.[date];
  if (entry && entry['4. close']) {
    return parseFloat(entry['4. close']);
  }

  console.warn(`Price not found for ${symbol} on ${date}`);
  return null;
}

export async function GET() {
  try {
    const pending = await prisma.prediction.findMany({
      where: { actualPrice: null },
    });

    let updated = 0;

    for (const pred of pending) {
      const date = pred.datePredicted.toISOString().slice(0, 10); // YYYY-MM-DD
      const price = await fetchActualPrice(pred.symbol, date);

      if (price !== null) {
        await prisma.prediction.update({
          where: { id: pred.id },
          data: { actualPrice: price },
        });
        updated++;
      }
    }

    return NextResponse.json({ message: `✅ Updated ${updated} predictions.` });
  } catch (err) {
    console.error('❌ Error in /api/update-actuals:', err);
    return NextResponse.json({ error: 'Failed to update actual prices' }, { status: 500 });
  }
}
