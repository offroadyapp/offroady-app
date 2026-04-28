import { NextResponse } from 'next/server';
import { requireInternalAccess } from '@/lib/offroady/internal';
import { listExternalEventsForAdmin, upsertExternalEvent } from '@/lib/offroady/weekly-digests';

export async function GET(request: Request) {
  try {
    await requireInternalAccess(request);
    const events = await listExternalEventsForAdmin();
    return NextResponse.json({ ok: true, events });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load external events.' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireInternalAccess(request);
    const body = await request.json();
    const result = await upsertExternalEvent({
      title: body.title,
      startsAt: new Date(body.startsAt).toISOString(),
      endsAt: body.endsAt ? new Date(body.endsAt).toISOString() : null,
      locationName: body.locationName,
      region: body.region,
      summary: body.summary,
      sourceLabel: body.sourceLabel,
      sourceUrl: body.sourceUrl,
      ctaLabel: body.ctaLabel,
      status: body.status,
    });

    return NextResponse.json({ ok: true, event: result.event, syncAction: result.syncAction });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save external event.' },
      { status: 400 }
    );
  }
}
