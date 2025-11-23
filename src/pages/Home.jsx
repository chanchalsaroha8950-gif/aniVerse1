import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Flame, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import SeriesCard from '../components/SeriesCard.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';
import HeroCarousel from '../components/HeroCarousel.jsx';
import { fetchLibrary, fetchLatestEpisodes } from '../api/client.js';

const ITEMS_PER_PAGE = 15;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function Home() {
        const navigate = useNavigate();
        const location = useLocation();
        const [series, setSeries] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [query, setQuery] = useState('');
        const [typeFilter, setTypeFilter] = useState('All');
        const [genreFilter, setGenreFilter] = useState('All');
        const [sortOrder, setSortOrder] = useState('updated');
        const [letterFilter, setLetterFilter] = useState('All');
        const [currentPage, setCurrentPage] = useState(1);
        const [latestEpisodes, setLatestEpisodes] = useState([]);

        useEffect(() => {
                setLoading(true);
                Promise.all([fetchLibrary(), fetchLatestEpisodes()])
                        .then(([libraryList, episodesList]) => {
                                setSeries(libraryList);
                                setLatestEpisodes(episodesList);
                                setError(null);
                        })
                        .catch((err) => {
                                setSeries([]);
                                setError(err.message || 'Failed to load library');
                        })
                        .finally(() => setLoading(false));
        }, []);

        useEffect(() => {
                const handleHeaderSearch = (event) => {
                        setQuery(event.detail.query);
                        setTypeFilter(event.detail.type);
                };
                window.addEventListener('header-search', handleHeaderSearch);
                return () => window.removeEventListener('header-search', handleHeaderSearch);
        }, []);

        useEffect(() => {
                if (location.state?.searchQuery !== undefined) {
                        setQuery(location.state.searchQuery);
                        setTypeFilter(location.state.searchType || 'All');
                }
        }, [location.state]);

        const allGenres = useMemo(() => {
                const set = new Set();
                series.forEach((item) => {
                        const genres = Array.isArray(item.genres) 
                                ? item.genres 
                                : typeof item.genres === 'string' 
                                        ? item.genres.split(',').map(g => g.trim()).filter(Boolean)
                                        : [];
                        genres.forEach((genre) => set.add(genre));
                });
                return ['All', ...Array.from(set)];
        }, [series]);

        const latestEpisodeDates = useMemo(() => {
                const dateMap = new Map();
                latestEpisodes.forEach((ep) => {
                        const slug = ep.seriesSlug;
                        const date = new Date(ep.addedAt || ep.createdAt || ep.updatedAt || 0);
                        if (!dateMap.has(slug) || date > dateMap.get(slug)) {
                                dateMap.set(slug, date);
                        }
                });
                return dateMap;
        }, [latestEpisodes]);

        const filteredSeries = useMemo(() => {
                let results = [...series];
                
                if (typeFilter !== 'All') {
                        results = results.filter((item) => {
                                if (typeFilter === 'Movies') return item.type === 'movie';
                                if (typeFilter === 'Anime') return item.type !== 'movie';
                                return true;
                        });
                }
                if (genreFilter !== 'All') {
                        results = results.filter((item) => {
                                const genres = Array.isArray(item.genres) 
                                        ? item.genres 
                                        : typeof item.genres === 'string' 
                                                ? item.genres.split(',').map(g => g.trim()).filter(Boolean)
                                                : [];
                                return genres.includes(genreFilter);
                        });
                }
                if (query.trim()) {
                        const q = query.toLowerCase();
                        results = results.filter((item) => item.title.toLowerCase().includes(q));
                }
                if (letterFilter !== 'All') {
                        results = results.filter((item) => 
                                item.title.charAt(0).toUpperCase() === letterFilter
                        );
                }
                if (sortOrder === 'alphabetical') {
                        results.sort((a, b) => a.title.localeCompare(b.title));
                } else {
                        results.sort((a, b) => {
                                const dateA = latestEpisodeDates.get(a.slug) || new Date(a.updatedAt || 0);
                                const dateB = latestEpisodeDates.get(b.slug) || new Date(b.updatedAt || 0);
                                return dateB - dateA;
                        });
                }
                return results;
        }, [genreFilter, query, series, sortOrder, letterFilter, typeFilter, latestEpisodeDates]);

        const totalPages = Math.ceil(filteredSeries.length / ITEMS_PER_PAGE);
        const paginatedSeries = useMemo(() => {
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                return filteredSeries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        }, [filteredSeries, currentPage]);

        useEffect(() => {
                setCurrentPage(1);
        }, [query, genreFilter, letterFilter, sortOrder, typeFilter]);

        useEffect(() => {
                if (query.trim()) {
                        document.title = `Search: ${query} · LASTANIME`;
                } else {
                        document.title = 'LASTANIME · Watch Anime Online';
                }
        }, [query]);

        const trending = useMemo(
                () => filteredSeries.slice(0, 4),
                [filteredSeries]
        );

        const handlePageChange = (newPage) => {
                setCurrentPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const handleEpisodeClick = (ep) => {
                const seriesSlug = ep.seriesSlug || (ep.series ? ep.series.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '');
                if (!seriesSlug) {
                        console.error('Cannot navigate: series slug is missing', ep);
                        return;
                }
                const episodeId = `${ep.season}-${ep.episode}`;
                navigate(`/series/${seriesSlug}/episode/${episodeId}`);
        };

        return (
                <section className="home-background space-y-16 pb-20">
                        {!loading && series.length > 0 && !query.trim() && (
                                <div className="max-w-[1000px] mx-auto pt-8">
                                        <HeroCarousel series={series} />
                                </div>
                        )}

                        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4">
                        {latestEpisodes.length > 0 && !query.trim() && (
                                <>
                                        <div className="flex flex-col gap-4">
                                                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                                                        <Sparkles size={24} className="text-primary" />
                                                        Latest Episodes
                                                </h2>
                                                <div className="episode-scroll-container">
                                                        <div className="episode-scroll">
                                                                {latestEpisodes.slice(0, 9).map((ep) => (
                                                                        <div 
                                                                                key={`${ep.series}-S${ep.season}E${ep.episode}`} 
                                                                                className="episode-card-horizontal"
                                                                                onClick={() => handleEpisodeClick(ep)}
                                                                        >
                                                                                <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                                                                                        {ep.thumbnail ? (
                                                                                                <img 
                                                                                                        src={ep.thumbnail} 
                                                                                                        alt={ep.title} 
                                                                                                        className="w-full h-full object-cover object-center"
                                                                                                        loading="lazy"
                                                                                                        style={{ imageRendering: 'high-quality' }}
                                                                                                />
                                                                                        ) : (
                                                                                                <div className="w-full h-full bg-card/60 flex items-center justify-center">
                                                                                                        <Sparkles size={32} className="text-muted" />
                                                                                                </div>
                                                                                        )}
                                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                                                                                        <div className="absolute bottom-0 left-0 right-0 p-2">
                                                                                                <p className="text-[10px] sm:text-xs font-medium text-white truncate leading-tight">{ep.series}</p>
                                                                                                <p className="text-[9px] sm:text-[10px] text-primary mt-0.5">S{ep.season}E{ep.episode}</p>
                                                                                        </div>
                                                                                </div>
                                                                        </div>
                                                                ))}
                                                        </div>
                                                </div>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </>
                        )}

                                <div className="flex flex-col gap-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                                                                {query.trim() ? (
                                                                        <>
                                                                                <Search size={24} className="text-primary" />
                                                                                Your Results
                                                                        </>
                                                                ) : (
                                                                        'Latest library updates'
                                                                )}
                                                        </h2>
                                                        {!query.trim() && (
                                                                <p className="text-sm text-muted">
                                                                        Sorted by filesystem mtime. Scraper saves appear here automatically.
                                                                </p>
                                                        )}
                                                </div>
                                                <div className="glass-surface flex items-center gap-2 rounded-full px-3 py-1 text-xs">
                                                        <Filter size={16} />
                                                        <select
                                                                aria-label="Sort order"
                                                                className="bg-transparent text-muted focus:outline-none"
                                                                value={sortOrder}
                                                                onChange={(event) => setSortOrder(event.target.value)}
                                                        >
                                                                <option value="updated">Recently updated</option>
                                                                <option value="alphabetical">Alphabetical</option>
                                                        </select>
                                                </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-xs text-muted font-semibold">Genre:</p>
                                                {allGenres.slice(0, 10).map((tag) => (
                                                        <button
                                                                key={tag}
                                                                type="button"
                                                                onClick={() => setGenreFilter(tag)}
                                                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                                        genreFilter === tag
                                                                                ? 'bg-primary/20 text-primary'
                                                                                : 'bg-card text-muted hover:text-primary'
                                                                }`}
                                                        >
                                                                {tag}
                                                        </button>
                                                ))}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-xs text-muted font-semibold">Letter:</p>
                                                <button
                                                        type="button"
                                                        onClick={() => setLetterFilter('All')}
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                                letterFilter === 'All'
                                                                        ? 'bg-primary/20 text-primary'
                                                                        : 'bg-card text-muted hover:text-primary'
                                                        }`}
                                                >
                                                        All
                                                </button>
                                                {ALPHABET.map((letter) => (
                                                        <button
                                                                key={letter}
                                                                type="button"
                                                                onClick={() => setLetterFilter(letter)}
                                                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                                        letterFilter === letter
                                                                                ? 'bg-primary/20 text-primary'
                                                                                : 'bg-card text-muted hover:text-primary'
                                                                }`}
                                                        >
                                                                {letter}
                                                        </button>
                                                ))}
                                        </div>
                                </div>

                                {loading ? (
                                        <div className="grid gap-3 grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                                {Array.from({ length: 15 }).map((_, index) => (
                                                        <SkeletonCard key={index} />
                                                ))}
                                        </div>
                                ) : error ? (
                                        <div className="rounded-3xl bg-card/60 p-10 text-center text-muted">
                                                <p>{error}</p>
                                        </div>
                                ) : filteredSeries.length === 0 ? (
                                        <div className="rounded-3xl bg-card/60 p-10 text-center text-muted">
                                                <p>No titles matched your filters. Try adjusting the search or genre.</p>
                                        </div>
                                ) : (
                                        <>
                                                <div className="grid gap-3 grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                                        {paginatedSeries.map((item) => (
                                                                <SeriesCard
                                                                        key={item.slug}
                                                                        series={{
                                                                                slug: item.slug,
                                                                                title: item.title,
                                                                                poster: item.poster || '/placeholder.jpg',
                                                                                genres: item.genres || [],
                                                                                type: item.type
                                                                        }}
                                                                />
                                                        ))}
                                                </div>

                                                {totalPages > 1 && (
                                                        <div className="flex items-center justify-center gap-4">
                                                                <button
                                                                        type="button"
                                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                                        disabled={currentPage === 1}
                                                                        className="flex items-center gap-2 rounded-full border border-white/10 bg-card px-4 py-2 text-sm font-semibold text-muted transition hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                        <ChevronLeft size={16} />
                                                                        Previous
                                                                </button>
                                                                <div className="flex items-center gap-2">
                                                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                                                let pageNum;
                                                                                if (totalPages <= 5) {
                                                                                        pageNum = i + 1;
                                                                                } else if (currentPage <= 3) {
                                                                                        pageNum = i + 1;
                                                                                } else if (currentPage >= totalPages - 2) {
                                                                                        pageNum = totalPages - 4 + i;
                                                                                } else {
                                                                                        pageNum = currentPage - 2 + i;
                                                                                }
                                                                                return (
                                                                                        <button
                                                                                                key={pageNum}
                                                                                                type="button"
                                                                                                onClick={() => handlePageChange(pageNum)}
                                                                                                className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                                                                                        currentPage === pageNum
                                                                                                                ? 'bg-primary text-white'
                                                                                                                : 'bg-card text-muted hover:text-primary'
                                                                                                }`}
                                                                                        >
                                                                                                {pageNum}
                                                                                        </button>
                                                                                );
                                                                        })}
                                                                </div>
                                                                <button
                                                                        type="button"
                                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                                        disabled={currentPage === totalPages}
                                                                        className="flex items-center gap-2 rounded-full border border-white/10 bg-card px-4 py-2 text-sm font-semibold text-muted transition hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                        Next
                                                                        <ChevronRight size={16} />
                                                                </button>
                                                        </div>
                                                )}

                                                <div className="text-center text-sm text-muted">
                                                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredSeries.length)} of {filteredSeries.length} anime
                                                </div>
                                        </>
                                )}

                                <div className="glass-surface rounded-3xl border border-white/5 p-8">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div>
                                                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                                                <Sparkles size={18} />
                                                                Trending in your archive
                                                        </h3>
                                                        <p className="text-sm text-muted">
                                                                Displaying the freshest four directories. Keep the watcher running to populate more.
                                                        </p>
                                                </div>
                                                <button
                                                        type="button"
                                                        className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-muted transition hover:text-primary"
                                                >
                                                        View all
                                                </button>
                                        </div>

                                        <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                                                {(trending.length ? trending : filteredSeries.slice(0, 4)).map((item) => (
                                                        <div
                                                                key={item.slug}
                                                                className="card-hover min-w-[220px] rounded-2xl bg-card p-4 text-sm text-muted/80"
                                                        >
                                                                <p className="text-xs text-muted">
                                                                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}
                                                                </p>
                                                                <h4 className="mt-1 text-base font-semibold text-white">{item.title}</h4>
                                                                <p className="text-xs uppercase text-muted">
                                                                        {item.type === 'movie' ? 'Movie' : 'Series'}
                                                                </p>
                                                                <p className="mt-3 line-clamp-3 text-xs text-muted">
                                                                        {item.synopsis || 'Synopsis unavailable.'}
                                                                </p>
                                                        </div>
                                                ))}
                                        </div>
                                </div>
                        </div>
                </section>
        );
}

export default Home;
