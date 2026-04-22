"use client";

import FavoriteToggleButton from './FavoriteToggleButton';

type Props = {
  trailSlug: string;
  initialFavorite: boolean;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  activeLabel?: string;
  inactiveLabel?: string;
};

export default function FavoriteTrailButton({ trailSlug, initialFavorite, className, activeClassName, inactiveClassName, activeLabel, inactiveLabel }: Props) {
  return (
    <FavoriteToggleButton
      apiPath={`/api/trails/${trailSlug}/favorite`}
      initialFavorite={initialFavorite}
      refreshOnSuccess={true}
      className={className}
      activeClassName={activeClassName}
      inactiveClassName={inactiveClassName}
      activeLabel={activeLabel}
      inactiveLabel={inactiveLabel}
    />
  );
}
