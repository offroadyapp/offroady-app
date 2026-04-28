import { NextResponse } from 'next/server';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Supabase auth configuration is unavailable';
}

export async function GET() {
  try {
    return NextResponse.json({
      url: getSupabaseUrl(),
      anonKey: getSupabaseAnonKey(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
