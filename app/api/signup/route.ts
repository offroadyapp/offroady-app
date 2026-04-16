import { NextResponse } from 'next/server';
import { createSignup } from '@/lib/offroady/community';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createSignup({
      displayName: body.displayName,
      email: body.email,
      phone: body.phone,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Signup failed' },
      { status: 400 }
    );
  }
}
