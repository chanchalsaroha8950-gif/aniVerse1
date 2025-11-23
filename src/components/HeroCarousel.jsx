import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

function HeroCarousel({ series }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const getSeasonalAnime = () => {
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const daysSinceEpoch = Math.floor(Date.now() / threeDaysInMs);
    const batchSize = 5;
    const totalBatches = Math.ceil(series.length / batchSize);
    const currentBatch = daysSinceEpoch % totalBatches;
    const startIndex = currentBatch * batchSize;
    const endIndex = startIndex + batchSize;
    return series.slice(startIndex, endIndex);
  };

  const latestSeries = series.length > 0 ? getSeasonalAnime() : [];

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 8000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handlePrevious = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === 0 ? latestSeries.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === latestSeries.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 600);
  };

  if (latestSeries.length === 0) return null;

  const currentSeries = latestSeries[currentIndex];
  const genres = Array.isArray(currentSeries.genres) 
    ? currentSeries.genres 
    : typeof currentSeries.genres === 'string' 
      ? currentSeries.genres.split(',').map(g => g.trim()).filter(Boolean)
      : [];

  return (
    <div className="relative h-[450px] w-full overflow-hidden rounded-3xl mx-4 mb-16">
      {latestSeries.map((anime, index) => (
        <div
          key={anime.slug}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentIndex
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-105'
          }`}
        >
          <img
            src={anime.poster || '/placeholder.jpg'}
            alt={anime.title}
            loading={index === 0 ? 'eager' : 'lazy'}
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ imageRendering: 'high-quality' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        </div>
      ))}

      <div className="relative h-full flex items-end pb-16">
        <div className="max-w-7xl mx-auto px-8 w-full">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
              <div className="h-px w-8 bg-gradient-to-r from-blue-500 to-purple-500" />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Latest Anime</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold leading-tight drop-shadow-2xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {currentSeries.title}
            </h1>

            <div className="flex flex-wrap gap-2">
              {genres.slice(0, 5).map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-semibold text-white/90"
                >
                  {genre}
                </span>
              ))}
              {genres.length === 0 && (
                <>
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-semibold text-white/90">
                    {currentSeries.type === 'movie' ? 'Movie' : 'Series'}
                  </span>
                  {currentSeries.release_year && (
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-semibold text-white/90">
                      {currentSeries.release_year}
                    </span>
                  )}
                </>
              )}
            </div>

            <Link
              to={currentSeries.type === 'movie' ? `/movie/${currentSeries.slug}` : `/series/${currentSeries.slug}`}
              className="inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-full transition-all duration-300 shadow-xl shadow-primary/50 hover:shadow-2xl hover:shadow-primary/60 hover:scale-105"
            >
              <Play size={20} fill="currentColor" />
              Watch Now
            </Link>
          </div>
        </div>
      </div>

      <button
        onClick={handlePrevious}
        disabled={isAnimating}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
        aria-label="Previous"
      >
        <ChevronLeft size={28} strokeWidth={2.5} />
      </button>

      <button
        onClick={handleNext}
        disabled={isAnimating}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
        aria-label="Next"
      >
        <ChevronRight size={28} strokeWidth={2.5} />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {latestSeries.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isAnimating) {
                setIsAnimating(true);
                setCurrentIndex(index);
                setTimeout(() => setIsAnimating(false), 600);
              }
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-12 bg-primary shadow-lg shadow-primary/50'
                : 'w-8 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default HeroCarousel;
