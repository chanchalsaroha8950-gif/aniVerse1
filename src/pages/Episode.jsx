import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EpisodeCard from '../components/EpisodeCard.jsx';
import PlayerModal from '../components/PlayerModal.jsx';
import { fetchEpisode, fetchSeriesMetadata } from '../api/client.js';

function parseEpisodeParam(param) {
        if (!param) return null;
        const normalized = param.toLowerCase();

        // Handles formats like "2-12", "2x12", "s2e12"
        const match = normalized.match(/(\d+)[\-x](\d+)/i);
        if (match) return { season: match[1], episode: match[2] };

        const sMatch = normalized.match(/s(\d+)e(\d+)/);
        if (sMatch) return { season: sMatch[1], episode: sMatch[2] };

        const numberOnly = normalized.match(/(\d+)/);
        if (numberOnly) return { season: '1', episode: numberOnly[1] };

        return null;
}

function Episode() {
        const { id, episodeId } = useParams();
        const navigate = useNavigate();

        const [seriesMeta, setSeriesMeta] = useState(null);
        const [episodeData, setEpisodeData] = useState(null);
        const [loadingSeries, setLoadingSeries] = useState(true);
        const [loadingEpisode, setLoadingEpisode] = useState(true);
        const [playerOpen, setPlayerOpen] = useState(true);
        const [episodeError, setEpisodeError] = useState(null);

        const parsed = useMemo(() => parseEpisodeParam(episodeId), [episodeId]);

        useEffect(() => {
                setLoadingSeries(true);
                fetchSeriesMetadata(id)
                        .then((meta) => setSeriesMeta(meta))
                        .catch(() => setSeriesMeta(null))
                        .finally(() => setLoadingSeries(false));
        }, [id]);

        useEffect(() => {
                if (!parsed) {
                        setEpisodeError('Invalid episode identifier.');
                        setEpisodeData(null);
                        setLoadingEpisode(false);
                        return;
                }

                setLoadingEpisode(true);
                setEpisodeError(null);
                setPlayerOpen(true);
                fetchEpisode(id, parsed.season, parsed.episode)
                        .then((payload) => {
                                setEpisodeData(payload);
                        })
                        .catch(() => {
                                setEpisodeError('Episode not found');
                                setEpisodeData(null);
                        })
                        .finally(() => setLoadingEpisode(false));
        }, [id, parsed]);

        const normalizedEpisode = useMemo(() => {
                if (!episodeData || !parsed) return null;

                const seasonDetail = seriesMeta?.episodes?.[parsed.season] || [];
                const detailMatch = seasonDetail.find(
                        (ep) => Number(ep.number) === Number(parsed.episode)
                );

                return {
                        title:
                                detailMatch?.title ||
                                episodeData.episode_title ||
                                episodeData.title ||
                                `Episode ${parsed?.episode ?? ''}`,
                        duration: detailMatch?.duration || episodeData.duration || '',
                        description: detailMatch?.description || episodeData.description || '',
                        thumbnail:
                                detailMatch?.thumbnail ||
                                episodeData.episode_main_poster ||
                                episodeData.thumbnail ||
                                episodeData.episode_card_thumbnail ||
                                episodeData.episode_list_thumbnail ||
                                '/placeholder.jpg',
                        servers: Array.isArray(episodeData.servers)
                                ? episodeData.servers.filter((server) => server?.url || server?.real_video)
                                : [],
                        releaseDate: episodeData.releaseDate || ''
                };
        }, [episodeData, parsed, seriesMeta]);

        const allSeasonEpisodes = useMemo(() => {
                if (!seriesMeta?.episodes || !parsed?.season) return [];
                const seasonEps = seriesMeta.episodes[parsed.season] || [];
                return seasonEps.sort((a, b) => Number(a.number) - Number(b.number));
        }, [seriesMeta, parsed]);

        const handleNavigateEpisode = (season, episodeNumber) => {
                navigate(`/series/${id}/episode/${season}-${episodeNumber}`);
        };

        const handlePrev = () => {
                if (!parsed || allSeasonEpisodes.length === 0) return;
                const index = allSeasonEpisodes.findIndex(
                        (item) => Number(item.number) === Number(parsed.episode)
                );
                const prevEp = allSeasonEpisodes[index - 1];
                if (prevEp) handleNavigateEpisode(parsed.season, prevEp.number);
        };

        const handleNext = () => {
                if (!parsed || allSeasonEpisodes.length === 0) return;
                const index = allSeasonEpisodes.findIndex(
                        (item) => Number(item.number) === Number(parsed.episode)
                );
                const nextEp = allSeasonEpisodes[index + 1];
                if (nextEp) handleNavigateEpisode(parsed.season, nextEp.number);
        };

        if (episodeError && !loadingEpisode) {
                return (
                        <section className="py-20 text-center">
                                <h1 className="text-3xl font-semibold text-white">Episode not found</h1>
                                <p className="mt-4 text-muted">
                                        Unable to locate this episode in the data store. Verify that the JSON file
                                        exists under <code>data/{id}/season-{parsed?.season}/episode-{parsed?.episode}.json</code>.
                                </p>
                                <Link
                                        to={`/series/${id}`}
                                        className="mt-6 inline-flex rounded-full bg-primary px-4 py-2 text-white transition hover:bg-primary/90"
                                >
                                        Back to series
                                </Link>
                        </section>
                );
        }

        if (loadingEpisode || loadingSeries) {
                return (
                        <section className="py-20 text-center text-muted">
                                <p>Loading episode…</p>
                        </section>
                );
        }

        if (!seriesMeta || !normalizedEpisode || !parsed) {
                return (
                        <section className="py-20 text-center">
                                <h1 className="text-3xl font-semibold text-white">Episode unavailable</h1>
                        </section>
                );
        }

        return (
                <>
                        {/* Background Banner Image - Blurred Effect */}
                        {seriesMeta.banner_image && (
                                <div className="fixed inset-0 z-0">
                                        <div 
                                                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                                style={{
                                                        backgroundImage: `url(${seriesMeta.banner_image})`,
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
                                                        src={seriesMeta.poster || '/placeholder.jpg'}
                                                        alt={`${seriesMeta.title} poster`}
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
                                                        /{' '}
                                                        <Link to={`/series/${id}`} className="hover:text-primary">
                                                                {seriesMeta.title}
                                                        </Link>
                                                        {' '}/ Episode {parsed.episode}
                                                </p>
                                                
                                                {/* Title */}
                                                <h1 className="text-3xl md:text-4xl font-bold text-white">{seriesMeta.title}</h1>
                                                
                                                {/* Episode Info */}
                                                <p className="text-lg text-primary font-semibold">
                                                        Season {parsed.season} • Episode {parsed.episode}
                                                        {normalizedEpisode.title && normalizedEpisode.title !== `Episode ${parsed.episode}` && ` - ${normalizedEpisode.title}`}
                                                </p>
                                                
                                                {/* Genres */}
                                                {(seriesMeta.genres && seriesMeta.genres.length > 0) && (
                                                        <div className="flex flex-wrap gap-1">
                                                                {seriesMeta.genres.map((genre, index) => (
                                                                        <span key={genre}>
                                                                                <span className="text-sm text-primary hover:underline cursor-pointer">
                                                                                        {genre}
                                                                                </span>
                                                                                {index < seriesMeta.genres.length - 1 && (
                                                                                        <span className="text-muted">, </span>
                                                                                )}
                                                                        </span>
                                                                ))}
                                                        </div>
                                                )}
                                                
                                                {/* Description */}
                                                <p className="text-muted/90 leading-relaxed">
                                                        {normalizedEpisode.description || seriesMeta.description || 'Description unavailable.'}
                                                </p>
                                                
                                                {/* Episode Metadata */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-white/10">
                                                        {normalizedEpisode.duration && (
                                                                <div>
                                                                        <span className="text-primary font-semibold">Duration:</span>
                                                                        <span className="ml-2 text-muted">{normalizedEpisode.duration}</span>
                                                                </div>
                                                        )}
                                                        {normalizedEpisode.releaseDate && (
                                                                <div>
                                                                        <span className="text-primary font-semibold">Release Date:</span>
                                                                        <span className="ml-2 text-muted">{normalizedEpisode.releaseDate}</span>
                                                                </div>
                                                        )}
                                                        <div>
                                                                <span className="text-primary font-semibold">Season:</span>
                                                                <span className="ml-2 text-muted">{parsed.season}</span>
                                                        </div>
                                                        <div>
                                                                <span className="text-primary font-semibold">Episode Number:</span>
                                                                <span className="ml-2 text-muted">{parsed.episode}</span>
                                                        </div>
                                                </div>
                                                
                                                {/* Play Button */}
                                                <button
                                                        type="button"
                                                        onClick={() => setPlayerOpen(true)}
                                                        className="rounded-full bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-primary/90 hover:shadow-xl"
                                                >
                                                        Play Episode
                                                </button>
                                        </div>
                                </div>
                        </section>

                        <section className="mx-auto max-w-6xl px-4 py-10 relative z-10">
                                {seriesMeta?.episodes && Object.keys(seriesMeta.episodes).length > 1 && (
                                        <div className="mt-8">
                                                <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-white">Seasons</h3>
                                                <div className="flex flex-wrap gap-2">
                                                        {Object.keys(seriesMeta.episodes).sort((a, b) => Number(a) - Number(b)).map((seasonNum) => (
                                                                <button
                                                                        key={seasonNum}
                                                                        type="button"
                                                                        onClick={() => {
                                                                                const firstEp = seriesMeta.episodes[seasonNum]?.[0];
                                                                                if (firstEp) {
                                                                                        handleNavigateEpisode(seasonNum, firstEp.number);
                                                                                }
                                                                        }}
                                                                        className={`rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold transition ${
                                                                                parsed.season === seasonNum
                                                                                        ? 'bg-primary text-white'
                                                                                        : 'bg-card text-muted hover:text-primary hover:bg-card/80'
                                                                        }`}
                                                                >
                                                                        Season {seasonNum}
                                                                </button>
                                                        ))}
                                                </div>
                                        </div>
                                )}

                                {allSeasonEpisodes.length > 0 && (
                                        <div className="mt-8">
                                                <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-white">Episodes - Season {parsed.season}</h3>
                                                <div className="grid gap-3 grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                                        {allSeasonEpisodes.map((ep) => (
                                                                <EpisodeCard key={ep.id} episode={ep} seriesSlug={id} />
                                                        ))}
                                                </div>
                                        </div>
                                )}
                        </section>

                        <PlayerModal
                                open={playerOpen}
                                onClose={() => setPlayerOpen(false)}
                                episode={normalizedEpisode}
                                onPrev={handlePrev}
                                onNext={handleNext}
                                seriesTitle={seriesMeta?.title}
                        />
                </>
        );
}

export default Episode;
