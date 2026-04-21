"use client";

import FavoriteToggleButton from './FavoriteToggleButton';

type Props = {
  trailSlug: string;
  initialFavorite: boolean;
};

export default function FavoriteTrailButton({ trailSlug, initialFavorite }: Props) {
  return <FavoriteToggleButton apiPath={`/api/trails/${trailSlug}/favorite`} initialFavorite={initialFavorite} refreshOnSuccess={true} />;
}
