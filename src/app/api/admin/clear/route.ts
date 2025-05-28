import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    await prisma.prediction.deleteMany();
    return NextResponse.json({ success: true, message: 'All predictions cleared.' });
  } catch (error) {
    console.error('Error clearing predictions:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear predictions' }, { status: 500 });
  }
}
