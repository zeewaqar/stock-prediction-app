// src/app/api/predictions/route.ts
import { prisma }       from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url    = new URL(req.url);
  const page   = Number(url.searchParams.get('page')  || '1');
  const limit  = Number(url.searchParams.get('limit') || '10');
  const symbol = url.searchParams.get('symbol') || undefined;

  const where = symbol ? { symbol } : {};

  // fetch total count + paginated data
  const [ total, raw ] = await Promise.all([
    prisma.prediction.count({ where }),
    prisma.prediction.findMany({
      where,
      orderBy: { datePredicted: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
  ]);

  // map in the error field
  const predictions = raw.map((p) => {
    const { predictedPrice, actualPrice, ...rest } = p;
    const error =
      typeof actualPrice === 'number'
        ? Math.abs(predictedPrice - actualPrice)
        : null;

    return {
      ...rest,
      predictedPrice,
      actualPrice,
      error,
    };
  });

  return NextResponse.json({ total, predictions });
}
