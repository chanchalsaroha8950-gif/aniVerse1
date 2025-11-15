const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function handleResponse(response) {
        if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const message = error?.error || error?.message || 'Request failed';
                throw new Error(message);
        }
        return response.json();
}

async function fetchWithErrorHandling(url) {
        try {
                const response = await fetch(url);
                return handleResponse(response);
        } catch (error) {
                if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                        console.error('❌ Backend server not reachable');
                        throw new Error('Cannot connect to backend server');
                }
                throw error;
        }
}

export async function fetchLibrary() {
        return fetchWithErrorHandling(`${BASE_URL}/library`);
}

export async function fetchSeriesMetadata(slug) {
        return fetchWithErrorHandling(`${BASE_URL}/series/${encodeURIComponent(slug)}`);
}

export async function fetchMovieMetadata(slug) {
        return fetchWithErrorHandling(`${BASE_URL}/movies/${encodeURIComponent(slug)}`);
}

export async function fetchEpisode(slug, season, episode) {
        return fetchWithErrorHandling(
                `${BASE_URL}/series/${encodeURIComponent(slug)}/episode/${season}-${episode}`
        );
}

export async function fetchLatestEpisodes() {
        return fetchWithErrorHandling(`${BASE_URL}/latest-episodes`);
}
