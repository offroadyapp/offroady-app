"use client";

import Link from 'next/link';
import FavoriteToggleButton from './FavoriteToggleButton';
import LeaveActionButton from './LeaveActionButton';
import type { CrewMembershipSummary } from '@/lib/offroady/account';

type Props = {
  crews: CrewMembershipSummary[];
};

export default function CrewsDashboard({ crews }: Props) {
  return (
    <div className="space-y-4">
      {crews.map((crew) => (
        <div key={crew.id} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link href={`/crews/${crew.id}`} className="text-lg font-semibold text-[#243126] hover:text-[#2f5d3a]">{crew.crewName}</Link>
              <div className="mt-1 text-sm text-gray-500">{crew.memberCount} members · {crew.role}</div>
              <div className="mt-2 text-sm text-gray-600">Trail: {crew.trailTitle}</div>
              {crew.description ? <p className="mt-3 text-sm leading-6 text-gray-600">{crew.description}</p> : null}
            </div>
            <div className="flex flex-col items-end gap-3">
              <FavoriteToggleButton apiPath={`/api/crews/${crew.id}/favorite`} initialFavorite={crew.isFavorite} refreshOnSuccess={true} />
              {crew.canLeave ? (
                <LeaveActionButton
                  label="Leave Crew"
                  confirmTitle="Leave this crew?"
                  confirmBody="You will no longer be listed as a member of this crew."
                  apiPath={`/api/crews/${crew.id}/membership`}
                  successMessage="Left crew."
                />
              ) : (
                <div className="max-w-[220px] text-right text-xs text-amber-700">Transfer ownership or dissolve the crew before leaving.</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
