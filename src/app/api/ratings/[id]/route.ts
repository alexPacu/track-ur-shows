import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: 'Rating endpoint - not implemented yet', id: params.id });
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: 'Rating endpoint - not implemented yet', id: params.id });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: 'Rating endpoint - not implemented yet', id: params.id });
}
