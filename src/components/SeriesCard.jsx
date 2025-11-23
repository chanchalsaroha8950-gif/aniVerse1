import { Link } from 'react-router-dom';

function SeriesCard({ series }) {
  const href = series.type === 'movie' ? `/movie/${series.slug}` : `/series/${series.slug}`;
  
  const genres = Array.isArray(series.genres) 
    ? series.genres 
    : typeof series.genres === 'string' 
      ? series.genres.split(',').map(g => g.trim()).filter(Boolean)
      : [];

  return (
    <Link
      to={href}
      className="card-hover relative block overflow-hidden rounded-lg md:rounded-2xl bg-card p-1 md:p-2 focus-visible:ring-2 focus-visible:ring-primary"
    >
      <img
        src={series.poster || '/placeholder.jpg'}
        alt={`${series.title} artwork`}
        loading="lazy"
        className="w-full aspect-[3/4] rounded-md md:rounded-xl object-cover object-center"
        style={{ imageRendering: 'high-quality' }}
      />
      <div className="absolute inset-0 rounded-lg md:rounded-2xl bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />
      <div className="absolute inset-x-1.5 bottom-1.5 md:inset-x-3 md:bottom-3 z-10">
        <p className="text-[9px] md:text-xs uppercase text-muted truncate">
          {series.type === 'movie' ? 'Movie' : 'Series'}
          {genres.length ? ` · ${genres.slice(0, 1).join(' · ')}` : ''}
        </p>
        <h3 className="mt-0.5 md:mt-1 text-xs md:text-lg font-semibold text-white line-clamp-2">{series.title}</h3>
      </div>
    </Link>
  );
}

export default SeriesCard;
