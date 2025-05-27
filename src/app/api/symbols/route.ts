// app/api/symbols/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const symbols = await prisma.prediction.findMany({
    distinct: ['symbol'],
    select: { symbol: true },
    orderBy: { symbol: 'asc' },
  });

  return NextResponse.json(symbols.map(s => s.symbol));
}
