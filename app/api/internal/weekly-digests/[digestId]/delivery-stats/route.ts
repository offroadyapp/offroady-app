import { NextResponse } from 'next/server';
import { hasInternalApiSecret } from '@/lib/offroady/internal';
import { getServiceSupabase } from '@/lib/supabase/server';

export async function GET(request: Request, context: { params: Promise<{ digestId: string }> }) {
  try {
    const hasApiSecret = hasInternalApiSecret(request);
    if (!hasApiSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { digestId } = await context.params;
    const supabase = getServiceSupabase();

    // Get counts by status
    const { count: sentCount, error: sentError } = await supabase
      .from('weekly_digest_email_deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('digest_id', digestId)
      .eq('status', 'sent');

    const { count: failedCount, error: failedError } = await supabase
      .from('weekly_digest_email_deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('digest_id', digestId)
      .eq('status', 'failed');

    const { count: pendingCount, error: pendingError } = await supabase
      .from('weekly_digest_email_deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('digest_id', digestId)
      .eq('status', 'pending');

    if (sentError) throw sentError;
    if (failedError) throw failedError;
    if (pendingError) throw pendingError;

    const totalCount = (sentCount ?? 0) + (failedCount ?? 0) + (pendingCount ?? 0);

    return NextResponse.json({
      digestId,
      logged: totalCount > 0,
      sentCount: sentCount ?? 0,
      failedCount: failedCount ?? 0,
      pendingCount: pendingCount ?? 0,
      totalCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get delivery stats.' },
      { status: 400 }
    );
  }
}
