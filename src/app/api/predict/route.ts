// src/app/api/predict/route.ts
import { NextResponse }      from 'next/server';
import { prisma }            from '@/lib/prisma';
import { queryGroqArray }    from '@/lib/groq';

export async function POST(req: Request) {
  try {
    const { symbol, prices } = await req.json();
    if (
      typeof symbol !== 'string' ||
      !Array.isArray(prices) ||
      prices.some((p) => typeof p.price !== 'number')
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const hist = prices
      .map((p: { date: string; price: number }) => `${p.date}:${p.price}`)
      .join(', ');
    const prompt = `Historical closing prices for ${symbol}: ${hist}.`;

    // 1️⃣ Ask the model for a 7-day forecast
    const forecast = await queryGroqArray(prompt);

    // 2️⃣ Bulk-insert one Prediction row per day
    await prisma.prediction.createMany({
      data: forecast.map((f) => ({
        symbol,
        datePredicted: new Date(f.date),
        predictedPrice: f.predicted_price,
      })),
    });

    // 3️⃣ Return the same array for UI rendering
    return NextResponse.json({
      symbol,
      forecast: forecast.map((f) => ({
        date:           f.date,
        predictedPrice: f.predicted_price,
      })),
    });
  } catch (err: unknown) {
    console.error('[/api/predict] error:', err);
    const errorMessage =
      err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
        ? (err as { message: string }).message
        : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 502 }
    );
  }
}
