import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchMovieMetadata } from '../api/client.js';
import SkeletonCard from '../components/SkeletonCard.jsx';
import PlayerModal from '../components/PlayerModal.jsx';

function Movie() {
        const { id } = useParams();
        const [movie, setMovie] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [playerOpen, setPlayerOpen] = useState(false);

        useEffect(() => {
                setLoading(true);
                setError(null);
                fetchMovieMetadata(id)
                        .then((payload) => setMovie(payload))
                        .catch(() => {
                                setMovie(null);
                                setError('Movie not found');
                        })
                        .finally(() => setLoading(false));
        }, [id]);

        useEffect(() => {
                if (movie && movie.title) {
                        document.title = `${movie.title} · LASTANIME`;
                }
        }, [movie]);

        const normalizedEpisode = useMemo(() => {
                if (!movie) return null;
                
                let cleanDescription = movie.description || '';
                cleanDescription = cleanDescription
                        .replace(/Watch.*?(?:on|at)\s+ToonStream[^.!?]*(\.|\!|\?)/gi, '')
                        .replace(/Stream.*?(?:on|at)\s+ToonStream[^.!?]*(\.|\!|\?)/gi, '')
                        .replace(/Available.*?(?:on|at)\s+ToonStream[^.!?]*(\.|\!|\?)/gi, '')
                        .replace(/Download.*?(?:from|on)\s+ToonStream[^.!?]*(\.|\!|\?)/gi, '')
                        .replace(/\bToonStream\b/gi, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                
                return {
                        title: movie.title,
                        duration: movie.runtime ? `${movie.runtime} min` : '',
                        description: cleanDescription,
                        thumbnail: movie.poster || '/placeholder.jpg',
                        servers: Array.isArray(movie.servers) ? movie.servers : [],
                        releaseDate: movie.release_year ? String(movie.release_year) : ''
                };
        }, [movie]);

        if (loading) {
                return (
                        <section className="mx-auto max-w-5xl px-4 py-16">
                                <div className="grid gap-8 md:grid-cols-[260px,1fr]">
                                        <div className="h-96 rounded-3xl bg-card/50" />
                                        <div className="space-y-4">
                                                <div className="h-10 rounded bg-card/50" />
                                                <div className="glass-surface rounded-3xl p-6">
                                                        <SkeletonCard />
                                                </div>
                                        </div>
                                </div>
                        </section>
                );
        }

        if (error || !movie) {
                return (
                        <section className="py-20 text-center">
                                <h1 className="text-3xl font-semibold text-white">Movie not found</h1>
                                <p className="mt-4 text-muted">
                                        Ensure a <code>movie.json</code> file exists under <code>data/{id}/</code>.
                                </p>
                                <Link
                                        to="/"
                                        className="mt-6 inline-flex rounded-full bg-primary px-4 py-2 text-white transition hover:bg-primary/90"
                                >
                                        Back to home
                                </Link>
                        </section>
                );
        }

        return (
                <>
                        {/* Background Banner Image - Blurred Effect like ToonStream */}
                        {movie.banner_image && (
                                <div className="fixed inset-0 z-0">
                                        <div 
                                                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                                style={{
                                                        backgroundImage: `url(${movie.banner_image})`,
                                                        filter: 'blur(6px)',
                                                        opacity: 0.5,
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
                                                        src={movie.poster || '/placeholder.jpg'}
                                                        alt={`${movie.title} poster`}
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
                                                        / Movies
                                                </p>
                                                
                                                {/* Title */}
                                                <h1 className="text-3xl md:text-4xl font-bold text-white">{movie.title}</h1>
                                                {/* Genres */}
                                                {(movie.genres && movie.genres.length > 0) && (
                                                        <div className="flex flex-wrap gap-1">
                                                                {movie.genres.map((genre, index) => (
                                                                        <span key={genre}>
                                                                                <span className="text-sm text-primary hover:underline cursor-pointer">
                                                                                        {genre}
                                                                                </span>
                                                                                {index < movie.genres.length - 1 && (
                                                                                        <span className="text-muted">, </span>
                                                                                )}
                                                                        </span>
                                                                ))}
                                                        </div>
                                                )}
                                                
                                                {/* Description */}
                                                <p className="text-muted/90 leading-relaxed">{normalizedEpisode?.description || 'Description unavailable.'}</p>
                                                
                                                {/* Metadata Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-white/10">
                                                        <div>
                                                                <span className="text-primary font-semibold">Release Year:</span>
                                                                <span className="ml-2 text-muted">{movie.release_year || 'N/A'}</span>
                                                        </div>
                                                        {movie.runtime && (
                                                                <div>
                                                                        <span className="text-primary font-semibold">Runtime:</span>
                                                                        <span className="ml-2 text-muted">{movie.runtime} min</span>
                                                                </div>
                                                        )}
                                                        {movie.languages?.length > 0 && (
                                                                <div>
                                                                        <span className="text-primary font-semibold">Languages:</span>
                                                                        <span className="ml-2 text-muted">{movie.languages.join(', ')}</span>
                                                                </div>
                                                        )}
                                                </div>
                                                {/* Play Button */}
                                                <button
                                                        type="button"
                                                        onClick={() => setPlayerOpen(true)}
                                                        className="w-full md:w-auto rounded-lg bg-primary px-8 py-4 text-base font-semibold text-white transition hover:bg-primary/90 shadow-lg"
                                                >
                                                        ▶ Watch Now
                                                </button>
                                                
                                                {/* Available Servers */}
                                                <div className="glass-surface rounded-3xl border border-white/5 p-6 mt-6">
                                                        <h2 className="text-2xl font-bold text-white mb-4">Available Servers</h2>
                                                        <div className="space-y-3">
                                                                {normalizedEpisode?.servers?.length ? (
                                                                        normalizedEpisode.servers.map((server, index) => (
                                                                                <div
                                                                                        key={server.real_video || index}
                                                                                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-card/60 px-5 py-4 text-sm text-muted hover:border-primary/50 transition"
                                                                                >
                                                                                        <span className="font-medium">
                                                                                                Server {server.option ?? index + 1}
                                                                                        </span>
                                                                                        <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                        setPlayerOpen(true);
                                                                                                }}
                                                                                                className="rounded-full bg-primary/10 border border-primary px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                                                                                        >
                                                                                                Play
                                                                                        </button>
                                                                                </div>
                                                                        ))
                                                                ) : (
                                                                        <p className="rounded-2xl bg-card/60 px-5 py-4 text-sm text-muted">
                                                                                No servers available at the moment.
                                                                        </p>
                                                                )}
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </section>

                        <PlayerModal
                                open={playerOpen}
                                onClose={() => setPlayerOpen(false)}
                                episode={normalizedEpisode}
                                onPrev={null}
                                onNext={null}
                        />
                </>
        );
}

export default Movie;

