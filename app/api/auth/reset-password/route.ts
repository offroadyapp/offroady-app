import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Direct password reset is disabled. Request a reset email instead.' },
    { status: 410 }
  );
}
