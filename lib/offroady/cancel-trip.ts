import { getServiceSupabase } from '@/lib/supabase/server';

export async function cancelTripById(
  tripId: string,
  viewerId: string,
  reason: string
): Promise<void> {
  const supabase = getServiceSupabase();

  // Fetch the trip plan
  const { data: plan, error: planError } = await supabase
    .from('trip_plans')
    .select('id, created_by_user_id, status')
    .eq('id', tripId)
    .maybeSingle();
  if (planError) throw planError;
  if (!plan) throw new Error('Trip not found');
  if (plan.created_by_user_id !== viewerId) {
    throw new Error('Only the trip organizer can cancel this trip.');
  }
  if (plan.status === 'cancelled') {
    throw new Error('This trip has already been cancelled.');
  }
  if (plan.status === 'completed') {
    throw new Error('Cannot cancel a completed trip.');
  }

  const now = new Date().toISOString();

  // Update the trip plan status to cancelled (with optional cancelled_reason column)
  const updatePayload: Record<string, string> = {
    status: 'cancelled',
    updated_at: now,
  };

  // If a reason was provided, try to store it (column may not exist if migration hasn't run)
  if (reason.trim()) {
    try {
      const { error: reasonError } = await supabase
        .from('trip_plans')
        .update({ ...updatePayload, cancelled_reason: reason.trim() })
        .eq('id', tripId);
      if (reasonError) {
        // Column doesn't exist yet — fall back to status-only update
        const { error: fallbackError } = await supabase
          .from('trip_plans')
          .update(updatePayload)
          .eq('id', tripId);
        if (fallbackError) throw fallbackError;
      }
    } catch {
      // Fallback: update without cancelled_reason
      const { error: fallbackError } = await supabase
        .from('trip_plans')
        .update(updatePayload)
        .eq('id', tripId);
      if (fallbackError) throw fallbackError;
    }
  } else {
    const { error: updateError } = await supabase
      .from('trip_plans')
      .update(updatePayload)
      .eq('id', tripId);
    if (updateError) throw updateError;
  }

  // Cancel all active memberships
  const { error: membershipError } = await supabase
    .from('trip_memberships')
    .update({
      status: 'cancelled',
      updated_at: now,
    })
    .eq('trip_plan_id', tripId)
    .in('status', ['joined', 'approved', 'requested', 'waitlist']);
  if (membershipError) throw membershipError;
}
