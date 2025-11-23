import { useEffect, useMemo, useState } from 'react';
import { X, SkipBack, SkipForward } from 'lucide-react';

function formatServerLabel(server, index) {
        try {
                const url = new URL(server.real_video);
                return `Server ${server.option ?? index + 1} • ${url.hostname}`;
        } catch {
                return `Server ${server.option ?? index + 1}`;
        }
}

function PlayerModal({ open, onClose, episode, onPrev, onNext, seriesTitle }) {
        const [activeSource, setActiveSource] = useState('');

        const sources = useMemo(() => {
                if (Array.isArray(episode?.servers) && episode.servers.length > 0) {
                        return episode.servers.filter((server) => Boolean(server.real_video));
                }
                return [];
        }, [episode]);

        useEffect(() => {
                if (!open) return undefined;

                const handleKey = (event) => {
                        if (event.code === 'Escape') {
                                onClose();
                        }
                };

                window.addEventListener('keydown', handleKey);
                return () => window.removeEventListener('keydown', handleKey);
        }, [open, onClose]);

        useEffect(() => {
                if (!open) return;
                const defaultSource = sources[0]?.real_video || '';
                setActiveSource(defaultSource);
        }, [open, episode, sources]);

        if (!open || !episode) return null;

        return (
                <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-10"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Episode player"
                >
                        <div className="glass-surface relative w-full max-w-5xl rounded-3xl border border-white/10 p-6 shadow-floating">
                                <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="Close player"
                                        className="absolute right-4 top-4 rounded-full border border-white/10 bg-card/70 p-2 text-muted transition hover:text-primary"
                                >
                                        <X size={18} />
                                </button>

                                <div className="aspect-video overflow-hidden rounded-2xl bg-black">
                                        {activeSource ? (
                                                <iframe
                                                        key={activeSource}
                                                        src={activeSource}
                                                        title="Video player"
                                                        allowFullScreen
                                                        className="h-full w-full border-0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                />
                                        ) : (
                                                <div className="flex h-full items-center justify-center text-muted">
                                                        <p>No video source available</p>
                                                </div>
                                        )}
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                        <button
                                                type="button"
                                                aria-label="Previous episode"
                                                onClick={onPrev || undefined}
                                                disabled={!onPrev}
                                                className={`flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold transition ${
                                                        onPrev ? 'bg-primary text-white hover:bg-primary/90' : 'bg-card/40 text-muted opacity-60 cursor-not-allowed'
                                                }`}
                                        >
                                                <SkipBack size={18} />
                                                Previous
                                        </button>
                                        <button
                                                type="button"
                                                aria-label="Next episode"
                                                onClick={onNext || undefined}
                                                disabled={!onNext}
                                                className={`flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold transition ${
                                                        onNext ? 'bg-primary text-white hover:bg-primary/90' : 'bg-card/40 text-muted opacity-60 cursor-not-allowed'
                                                }`}
                                        >
                                                Next
                                                <SkipForward size={18} />
                                        </button>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
                                        {sources.length > 0 ? (
                                                <label className="flex items-center gap-2">
                                                        <span className="font-semibold text-white">Servers</span>
                                                        <select
                                                                className="rounded-full border border-white/10 bg-card px-3 py-2 text-xs text-muted focus:outline-none"
                                                                value={activeSource}
                                                                onChange={(event) => {
                                                                        setActiveSource(event.target.value);
                                                                }}
                                                        >
                                                                {sources.map((server, index) => (
                                                                        <option key={server.real_video} value={server.real_video}>
                                                                                {formatServerLabel(server, index)}
                                                                        </option>
                                                                ))}
                                                        </select>
                                                </label>
                                        ) : (
                                                <p className="rounded-full border border-white/10 bg-card px-3 py-2 text-xs text-muted">
                                                        No streaming servers registered for this episode.
                                                </p>
                                        )}
                                </div>

                                <div className="mt-6 space-y-2 text-sm text-muted">
                                        <p>
                                                <strong className="text-white">{episode?.title}</strong>
                                                {seriesTitle && ` · ${seriesTitle}`}
                                        </p>
                                        <p className="text-xs text-muted/80">
                                                If video doesn't play, please change the server from the dropdown above.
                                        </p>
                                </div>
                        </div>
                </div>
        );
}

export default PlayerModal;
