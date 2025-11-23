import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EpisodeCard from '../components/EpisodeCard.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';
import SeriesCard from '../components/SeriesCard.jsx';
import { fetchSeriesMetadata, fetchLibrary } from '../api/client.js';
import NotFound from './NotFound.jsx';

function Series() {
        const { id } = useParams();
        const navigate = useNavigate();
        const [series, setSeries] = useState(null);
        const [loading, setLoading] = useState(true);
        const [selectedSeason, setSelectedSeason] = useState('1');
        const [error, setError] = useState(null);
        const [suggestedAnime, setSuggestedAnime] = useState([]);

        useEffect(() => {
                setLoading(true);
                setError(null);
                fetchSeriesMetadata(id)
                        .then((meta) => {
                                if (meta.type === 'movie') {
                                        navigate(`/movie/${id}`, { replace: true });
                                        return;
                                }
                                setSeries(meta);
                                const defaultSeason = Object.keys(meta.seasons || {})[0] || '1';
                                setSelectedSeason(defaultSeason);
                        })
                        .catch(() => {
                                setSeries(null);
                                setError('Series not found');
                        })
                        .finally(() => setLoading(false));
        }, [id, navigate]);

        useEffect(() => {
                if (series && series.title) {
                        document.title = `${series.title} · LASTANIME`;
                }
        }, [series]);

        useEffect(() => {
                if (!series) return;
                
                fetchLibrary()
                        .then((library) => {
                                if (!Array.isArray(library) || library.length === 0) {
                                        setSuggestedAnime([]);
                                        return;
                                }
                                
                                const animeList = library.filter(
                                        (item) => item && item.type === 'series' && item.slug && item.slug !== id
                                );
                                
                                if (animeList.length === 0) {
                                        setSuggestedAnime([]);
                                        return;
                                }
                                
                                const seriesGenres = series.genres || [];
                                const withMatchingGenres = animeList.filter((anime) => {
                                        const animeGenres = anime.genres || [];
                                        return seriesGenres.some((genre) => animeGenres.includes(genre));
                                });
                                
                                const suggestionPool = withMatchingGenres.length >= 3 ? withMatchingGenres : animeList;
                                const shuffled = suggestionPool.sort(() => 0.5 - Math.random());
                                const count = Math.min(5, Math.floor(Math.random() * 3) + 3);
                                setSuggestedAnime(shuffled.slice(0, count));
                        })
                        .catch(() => setSuggestedAnime([]));
        }, [series, id]);

        const episodes = useMemo(() => {
                if (!series || !selectedSeason) return [];
                const list = series.episodes?.[selectedSeason] || [];
                return list.map((episode) => ({
                        id: episode.id || `${selectedSeason}-${episode.number}`,
                        number: episode.number,
                        title: episode.title || `Episode ${episode.number}`,
                        duration: episode.duration || '',
                        thumbnail: episode.thumbnail || '/placeholder.jpg',
                        description: episode.description || ''
                }));
        }, [series, selectedSeason]);

        if (error && !loading) {
                return <NotFound />;
        }

        if (loading || !series) {
                return (
                        <section className="mx-auto max-w-6xl px-4 py-16">
                                <div className="grid gap-8 md:grid-cols-[220px,1fr]">
                                        <div className="w-full aspect-[2/3] rounded-3xl bg-card/50" />
                                        <div className="space-y-4">
                                                <div className="h-10 rounded bg-card/50" />
                                                <div className="h-4 rounded bg-card/40" />
                                                <div className="glass-surface rounded-3xl p-6">
                                                        <div className="grid gap-4 sm:grid-cols-2">
                                                                {Array.from({ length: 4 }).map((_, index) => (
                                                                        <SkeletonCard key={index} />
                                                                ))}
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </section>
                );
        }

        return (
                <>
                        {/* Background Banner Image - Blurred Effect like ToonStream */}
                        {series.banner_image && (
                                <div className="fixed inset-0 z-0">
                                        <div 
                                                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                                style={{
                                                        backgroundImage: `url(${series.banner_image})`,
                                                        filter: 'blur(2px)',
                                                        opacity: 0.7,
                                                }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
                                </div>
                        )}
                        
                        <section className="mx-auto max-w-7xl px-4 py-8 md:py-12 relative z-10">
                                <div className="flex flex-col md:flex-row gap-8">
                                        {/* Left: Poster Image */}
                                        <div className="flex-shrink-0">
                                                <img
                                                        src={series.poster || '/placeholder.jpg'}
                                                        alt={`${series.title} poster`}
                                                        className="w-full md:w-64 aspect-[2/3] rounded-2xl object-cover shadow-2xl"
                                                />
                                        </div>
                                        
                                        {/* Right: Content */}
                                        <div className="flex-1 space-y-5">
                                                {/* Breadcrumb */}
                                                <p className="text-sm text-muted">
                                                        <Link to="/" className="hover:text-primary">
                                                                Home
                                                        </Link>{' '}
                                                        / Series
                                                </p>
                                                
                                                {/* Title */}
                                                <h1 className="text-3xl md:text-4xl font-bold text-white">{series.title}</h1>
                                                {/* Genres */}
                                                {(series.genres && series.genres.length > 0) && (
                                                        <div className="flex flex-wrap gap-1">
                                                                {series.genres.map((genre, index) => (
                                                                        <span key={genre}>
                                                                                <span className="text-sm text-primary hover:underline cursor-pointer">
                                                                                        {genre}
                                                                                </span>
                                                                                {index < series.genres.length - 1 && (
                                                                                        <span className="text-muted">, </span>
                                                                                )}
                                                                        </span>
                                                                ))}
                                                        </div>
                                                )}
                                                
                                                {/* Description */}
                                                <p className="text-muted/90 leading-relaxed">{series.description || 'Description unavailable.'}</p>
                                                
                                                {/* Metadata Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-white/10">
                                                        <div>
                                                                <span className="text-primary font-semibold">Release Year:</span>
                                                                <span className="ml-2 text-muted">{series.release_year || series.year || 'N/A'}</span>
                                                        </div>
                                                        <div>
                                                                <span className="text-primary font-semibold">Status:</span>
                                                                <span className="ml-2 text-muted">{series.status || 'Unknown'}</span>
                                                        </div>
                                                        <div>
                                                                <span className="text-primary font-semibold">Total Episodes:</span>
                                                                <span className="ml-2 text-muted">
                                                                        {series.totalEpisodes ||
                                                                                Object.values(series.seasons || {}).reduce(
                                                                                        (total, arr) => total + arr.length,
                                                                                        0
                                                                                )}
                                                                </span>
                                                        </div>
                                                        {series.languages?.length > 0 && (
                                                                <div>
                                                                        <span className="text-primary font-semibold">Languages:</span>
                                                                        <span className="ml-2 text-muted">{series.languages.join(', ')}</span>
                                                                </div>
                                                        )}
                                                </div>
                                                {/* Episodes Section */}
                                                <div className="glass-surface rounded-3xl border border-white/5 p-4 sm:p-6 mt-6">
                                                        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
                                                                <h2 className="text-lg sm:text-2xl font-bold text-white">Episodes</h2>
                                                                <div className="rounded-full border border-white/10 bg-card px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-muted">
                                                                        <select
                                                                                value={selectedSeason}
                                                                                onChange={(event) => setSelectedSeason(event.target.value)}
                                                                                className="bg-transparent focus:outline-none cursor-pointer text-xs sm:text-sm"
                                                                                aria-label="Select season"
                                                                        >
                                                                                {Object.keys(series.seasons || { 1: [] }).map((season) => (
                                                                                        <option key={season} value={season}>
                                                                                                Season {season}
                                                                                        </option>
                                                                                ))}
                                                                        </select>
                                                                </div>
                                                        </div>
                                                        {episodes.length === 0 ? (
                                                                <p className="text-sm text-muted">
                                                                        No episodes listed for this season.
                                                                </p>
                                                        ) : (
                                                                <div className="grid gap-3 grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                                                        {episodes.map((episode) => (
                                                                                <EpisodeCard key={episode.id} episode={episode} seriesSlug={series.slug} />
                                                                        ))}
                                                                </div>
                                                        )}
                                                </div>
                                        </div>
                                </div>

                        {suggestedAnime.length > 0 && (
                                <div className="mx-auto max-w-6xl px-4 pb-16">
                                        <h2 className="text-2xl font-semibold text-white mb-6">Suggested Anime</h2>
                                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                                {suggestedAnime.map((anime) => (
                                                        <SeriesCard key={anime.slug} series={anime} />
                                                ))}
                                        </div>
                                </div>
                        )}
                </section>
                </>
        );
}

export default Series;
