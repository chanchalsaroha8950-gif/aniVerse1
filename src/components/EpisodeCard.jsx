import { Link } from 'react-router-dom';

function EpisodeCard({ episode, seriesSlug }) {
  const href = `/series/${seriesSlug}/episode/${episode.id}`;
  
  return (
    <Link
      to={href}
      className="card-hover relative block overflow-hidden rounded-lg md:rounded-2xl bg-card p-1 md:p-2 focus-visible:ring-2 focus-visible:ring-primary"
    >
      <img
        src={episode.thumbnail || episode.episode_card_thumbnail || '/placeholder.jpg'}
        alt={`${episode.title} thumbnail`}
        loading="lazy"
        className="w-full aspect-video rounded-md md:rounded-xl object-cover"
      />
      <div className="absolute inset-0 rounded-lg md:rounded-2xl bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />
      <div className="absolute inset-x-1.5 bottom-1.5 md:inset-x-3 md:bottom-3 z-10">
        <p className="text-[8px] md:text-xs uppercase text-muted truncate">
          Episode {episode.number}
          {episode.duration && ` · ${episode.duration}`}
        </p>
        <h3 className="mt-0.5 md:mt-1 text-[10px] md:text-sm font-semibold text-white line-clamp-2">{episode.title}</h3>
      </div>
    </Link>
  );
}

export default EpisodeCard;
