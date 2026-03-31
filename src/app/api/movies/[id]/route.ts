import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: 'Movie endpoint - not implemented yet', id: params.id });
}
