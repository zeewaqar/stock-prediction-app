//app/api/stocks/route.ts
///limited
// export async function POST(req: Request) {
//     const { symbol } = await req.json();
//     const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${process.env.ALPHA_API_KEY}`);
//     const data = await response.json();
//     return Response.json(data);
//   }
  

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const FMP_API_KEY = process.env.FMP_API_KEY!;

export async function POST(req: Request) {
  const { symbol } = await req.json();
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Check DB for existing prices
  const existing = await prisma.stockPrice.findMany({
    where: {
      symbol,
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: 'asc' },
  });

  if (existing.length >= 25) {
    return NextResponse.json({
      prices: existing.map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        price: e.price,
      })),
    });
  }

  // 2. Fetch from FMP
  const res = await fetch(
    `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=30&apikey=${FMP_API_KEY}`
  );
  const apiData = await res.json();

  const prices =
    apiData.historical?.map((item: any) => ({
      date: new Date(item.date),
      price: item.close,
    })) ?? [];

  // 3. Filter duplicates (SQLite doesn't support skipDuplicates)
  const existingDates = new Set(
    existing.map((e) => e.date.toISOString().slice(0, 10))
  );

  const newEntries = prices.filter((p) => {
    const dateStr = p.date.toISOString().slice(0, 10);
    return !existingDates.has(dateStr);
  });

  // 4. Upsert each price (to avoid duplicates)
  for (const entry of newEntries) {
    await prisma.stockPrice.upsert({
      where: {
        symbol_date: {
          symbol,
          date: entry.date,
        },
      },
      update: {}, // no update; skip if exists
      create: {
        symbol,
        date: entry.date,
        price: entry.price,
      },
    });
  }

  // 5. Combine & return sorted results
  const combined = [...existing, ...newEntries].sort(
    (a, b) => +new Date(a.date) - +new Date(b.date)
  );

  return NextResponse.json({
    prices: combined.map((p) => ({
      date: p.date.toISOString().slice(0, 10),
      price: p.price,
    })),
  });
}
