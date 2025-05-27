import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const updates: { id: string; actualPrice: number }[] = await req.json();

  const results = await Promise.all(
    updates.map(({ id, actualPrice }) =>
      prisma.prediction.update({
        where: { id },
        data: { actualPrice },
      })
    )
  );

  return NextResponse.json({ updated: results.length });
}
