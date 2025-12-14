import axios from 'axios';
import * as cheerio from 'cheerio';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { supabase } from './server/supabase-client.js';

const CONFIG = {
	timeout: 30000,
	referer: 'https://toonstream.love/',
	maxRetries: 3,
};

const USER_AGENTS = [
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

const HOME_URL = 'https://toonstream.love/';
const POLL_INTERVAL_MS = 3000;
const BACKFILL_COOLDOWN_MS = 60 * 60 * 1000;

const seriesCache = new Map();
const seasonLocks = new Set();
const processedEpisodes = new Set();
const seriesHighestSeasons = new Map();
const seasonBackfillChecked = new Map();

let PROXY_LIST = [];
let currentProxyIndex = 0;

function loadProxies() {
	const proxyEnv = process.env.PROXY_LIST;
	if (!proxyEnv) {
		console.log('⚠️  No PROXY_LIST found in environment. Running without proxies.');
		return [];
	}
	
	const proxies = proxyEnv.split(',').map(p => p.trim()).filter(Boolean);
	console.log(`✅ Loaded ${proxies.length} proxies from environment`);
	return proxies;
}

function getNextProxy() {
	if (PROXY_LIST.length === 0) return null;
	
	const proxy = PROXY_LIST[currentProxyIndex];
	currentProxyIndex = (currentProxyIndex + 1) % PROXY_LIST.length;
	return proxy;
}

function createProxyAgent(proxyString) {
	const [host, port, username, password] = proxyString.split(':');
	const proxyUrl = `http://${username}:${password}@${host}:${port}`;
	return new HttpsProxyAgent(proxyUrl);
}

function getUA() {
	return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function normalizeUrl(rawUrl, base = 'https://toonstream.love') {
	if (!rawUrl || /^javascript:/i.test(rawUrl)) return null;
	try {
		return new URL(rawUrl, base).href;
	} catch {
		return null;
	}
}

async function fetchHtmlWithRetry(url, retries = CONFIG.maxRetries) {
	let lastErr = null;
	const totalAttempts = retries * Math.max(1, PROXY_LIST.length);
	
	for (let i = 1; i <= totalAttempts; i++) {
		try {
			const axiosConfig = {
				timeout: CONFIG.timeout,
				headers: {
					'User-Agent': getUA(),
					Referer: CONFIG.referer,
					Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				},
			};
			
			const proxyString = getNextProxy();
			if (proxyString) {
				axiosConfig.httpsAgent = createProxyAgent(proxyString);
				axiosConfig.httpAgent = createProxyAgent(proxyString);
				const proxyHost = proxyString.split(':')[0];
				console.log(`🔄 Attempt ${i}: Using proxy ${proxyHost}...`);
			}
			
			const res = await axios.get(url, axiosConfig);
			if (proxyString) {
				console.log(`✅ Success with proxy`);
			}
			return String(res.data || '');
		} catch (err) {
			lastErr = err;
			console.log(`❌ Fetch failed (attempt ${i}/${totalAttempts}): ${err.message}`);
			if (i < totalAttempts) {
				await delay(1000);
			}
		}
	}
	throw new Error(`Failed to fetch ${url} after ${totalAttempts} attempts: ${lastErr?.message || 'unknown error'}`);
}

function extractIframeEmbeds(episodeHtml) {
	const $ = cheerio.load(episodeHtml);
	const iframes = [];
	for (let i = 1; i <= 20; i++) {
		const container = $(`div#options-${i}`);
		if (!container.length) continue;
		container.find('iframe').each((_, el) => {
			const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
			const url = normalizeUrl(src);
			if (url) iframes.push({ option: i, url });
		});
	}
	$('iframe').each((_, el) => {
		const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
		const url = normalizeUrl(src);
		if (url && !iframes.some((x) => x.url === url)) iframes.push({ option: null, url });
	});
	return iframes;
}

async function resolveTrembedUrl(trembedUrl) {
	try {
		const html = await fetchHtmlWithRetry(trembedUrl);
		const $ = cheerio.load(html);
		const out = [];
		$('iframe').each((_, el) => {
			const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
			const url = normalizeUrl(src);
			if (url && !url.includes('toonstream.love')) out.push(url);
		});
		return out;
	} catch {
		return [];
	}
}

async function resolveEmbeds(embeds) {
	const resolved = [];
	await Promise.all(
		embeds.map(async (e) => {
			if (e.url.includes('trembed=')) {
				const real = await resolveTrembedUrl(e.url);
				if (real.length === 0) resolved.push({ option: e.option, url: e.url });
				else real.forEach((u) => resolved.push({ option: e.option, url: u }));
			} else if (e.url.includes('toonstream.love')) {
				const real = await resolveTrembedUrl(e.url);
				if (real.length === 0) resolved.push({ option: e.option, url: e.url });
				else real.forEach((u) => resolved.push({ option: e.option, url: u }));
			} else {
				resolved.push(e);
			}
		})
	);
	const seen = new Set();
	return resolved.filter((r) => {
		const key = `${r.option ?? 'x'}|${r.url}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function describeElement(el) {
	if (!el || !el.length) return null;
	const node = el.get(0);
	if (!node) return null;
	const tag = node.tagName || node.name || 'element';
	const id = el.attr('id') ? `#${el.attr('id')}` : '';
	const cls = el.attr('class') ? `.${el.attr('class').trim().replace(/\s+/g, '.')}` : '';
	return `${tag}${id}${cls}`;
}

function extractHomepageEpisodeCards(html) {
	const $ = cheerio.load(html);
	const episodes = [];
	const seen = new Set();

	const matchRegex = /\/(episode|watch|anime|series)\//i;

	$('a[href]').each((index, el) => {
		const href = normalizeUrl($(el).attr('href'));
		if (!href || !matchRegex.test(href)) return;
		if (!href.startsWith('https://toonstream.love')) return;
		if (seen.has(href)) return;

		seen.add(href);

		episodes.push(collectAnchorInfo($, $(el)));
	});

	return episodes;
}

function collectAnchorInfo($, anchor) {
	let title = (anchor.attr('title') || anchor.text().trim()).replace(/\s+/g, ' ');
	const href = normalizeUrl(anchor.attr('href'));

	let thumb = null;
	const img = anchor.find('img').first();
	if (img.length) {
		thumb = normalizeUrl(img.attr('data-src') || img.attr('src'));
	}
	let card = anchor.closest('article, li, .post-item, .film-item');
	if (!thumb && card.length) {
		const cardImg = card.find('img').first();
		if (cardImg.length) thumb = normalizeUrl(cardImg.attr('data-src') || cardImg.attr('src'));
	}

	if (!card.length) card = anchor.parent();

	const contextNode = anchor.closest('section, div.widget, article, div');
	let context = null;
	if (contextNode.length) {
		const headerText = contextNode
			.find('header h1, header h2, header h3, h2.widget-title, h3.widget-title')
			.first()
			.text()
			.trim();
		context = headerText || contextNode.attr('id') || contextNode.attr('class') || null;
	}

	if (!title) title = context || 'Untitled';

	return {
		title,
		url: href,
		thumbnail: thumb,
		context: context || 'page',
		location: describeElement(card) || describeElement(anchor) || 'unknown',
	};
}

function parseEpisodeCode(url) {
	const match = url.match(/(\d+)x(\d+)/i);
	if (!match) return null;
	return {
		season: parseInt(match[1], 10),
		episode: parseInt(match[2], 10),
	};
}

function slugFromUrl(url) {
	try {
		const u = new URL(url);
		const parts = u.pathname.split('/').filter(Boolean);
		return parts[1] || parts[parts.length - 1] || 'item';
	} catch {
		return 'item';
	}
}

function sanitizeName(name) {
	return (name || 'untitled')
		.replace(/[<>:"/\\|?*]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.substring(0, 120) || 'untitled';
}

function extractCommonFields(html) {
	const $ = cheerio.load(html);
	const title =
		$('h1.entry-title').first().text().trim() ||
		$('meta[property="og:title"]').attr('content')?.trim() ||
		$('title').first().text().trim() ||
		'';

	const description =
		$('meta[property="og:description"]').attr('content')?.trim() ||
		$('div.entry-content p').first().text().trim() ||
		$('div.description p').first().text().trim() ||
		'';

	let releaseYear = null;
	const yearMatch = $('span.year, .year, [class*="year"]').first().text().match(/\d{4}/);
	if (yearMatch) releaseYear = parseInt(yearMatch[0], 10);

	const genres = [];
	$('a[rel="tag"], .genres a, [class*="genre"] a').each((_, el) => {
		const genre = $(el).text().trim();
		if (genre) genres.push(genre);
	});

	let thumbnail =
		normalizeUrl(
			$('div.post-thumbnail img').attr('src') ||
			$('div.post-thumbnail img').attr('data-src') ||
			$('div.post-thumbnail img').attr('data-lazy-src')
		);
	if (!thumbnail) thumbnail = normalizeUrl($('meta[property="og:image"]').attr('content'));
	if (!thumbnail) thumbnail = normalizeUrl($('.series-cover img').attr('src') || $('.series-cover img').attr('data-src'));

	let tmdbId = null;
	let tvdbId = null;
	$('meta[property*="tmdb"], [data-tmdb-id], [data-tmdb]').each((_, el) => {
		const id = $(el).attr('content') || $(el).attr('data-tmdb-id') || $(el).attr('data-tmdb');
		if (id && !tmdbId) {
			const match = String(id).match(/(\d+)/);
			if (match) tmdbId = parseInt(match[1], 10);
		}
	});
	$('meta[property*="tvdb"], [data-tvdb-id], [data-tvdb]').each((_, el) => {
		const id = $(el).attr('content') || $(el).attr('data-tvdb-id') || $(el).attr('data-tvdb');
		if (id && !tvdbId) {
			const match = String(id).match(/(\d+)/);
			if (match) tvdbId = parseInt(match[1], 10);
		}
	});

	const languages = [];
	$('[class*="language"], [class*="lang"], .language, .lang').each((_, el) => {
		const lang = $(el).text().trim();
		if (lang && !languages.includes(lang)) languages.push(lang);
	});

	return {
		title: title.replace(/\s+/g, ' '),
		description: description.replace(/\s+/g, ' '),
		release_year: releaseYear,
		genres,
		thumbnail,
		tmdb_id: tmdbId,
		tvdb_id: tvdbId,
		languages,
	};
}

function extractEpisodeMainPoster(episodeHtml) {
	const $ = cheerio.load(episodeHtml);
	let poster = normalizeUrl(
		$('div.video-options img').attr('src') ||
		$('div.video-options img').attr('data-src') ||
		$('div.video-options img').attr('data-lazy-src')
	);
	if (!poster) {
		poster = normalizeUrl(
			$('div.post-thumbnail img').attr('src') ||
			$('div.post-thumbnail img').attr('data-src') ||
			$('meta[property="og:image"]').attr('content')
		);
	}
	return poster;
}

async function fetchEpisodeContext(episodeUrl) {
	const episodeHtml = await fetchHtmlWithRetry(episodeUrl);
	const $ = cheerio.load(episodeHtml);
	let seriesAnchor =
		$('nav.breadcrumb a[href*="/series/"]').last();
	if (!seriesAnchor.length) {
		seriesAnchor = $('div.breadcrumb a[href*="/series/"]').last();
	}
	if (!seriesAnchor.length) {
		seriesAnchor = $('.entry-meta a[href*="/series/"]').first();
	}
	let seriesUrl = normalizeUrl(seriesAnchor.attr('href'));
	let seriesTitle = seriesAnchor.text().trim() || null;
	if (!seriesUrl) {
		const fallback = deriveSeriesUrlFromEpisode(episodeUrl);
		seriesUrl = fallback;
	}
	if (!seriesTitle) {
		seriesTitle = $('meta[property="og:series"]').attr('content')?.trim() || null;
		if (!seriesTitle) {
			seriesTitle = $('title').text().split('|')[0].trim() || null;
		}
	}
	return { episodeHtml, seriesUrl, seriesTitle };
}

async function ensureSeriesInSupabase(seriesUrl, fallbackTitle = null) {
	if (!seriesUrl) throw new Error('Series URL not found for episode');
	if (seriesCache.has(seriesUrl)) return seriesCache.get(seriesUrl);

	const seriesHtml = await fetchHtmlWithRetry(seriesUrl);
	const common = extractCommonFields(seriesHtml);
	if (!common.title && fallbackTitle) common.title = fallbackTitle;
	if (!common.title) common.title = slugFromUrl(seriesUrl).replace(/-/g, ' ');
	const postId = extractPostId(seriesHtml);
	if (!postId) throw new Error('Series post ID not found');

	const baseName = sanitizeName(common.title || fallbackTitle || slugFromUrl(seriesUrl));
	
	const { data: existingSeries } = await supabase
		.from('series')
		.select('*')
		.eq('slug', baseName)
		.single();

	if (!existingSeries) {
		const { error } = await supabase.from('series').insert({
			slug: baseName,
			title: common.title,
			description: common.description,
			thumbnail: common.thumbnail,
			poster: common.thumbnail,
			genres: common.genres,
			release_year: common.release_year,
			url: seriesUrl,
			tmdb_id: common.tmdb_id?.toString() || null,
			tvdb_id: common.tvdb_id?.toString() || null,
			languages: common.languages,
			type: 'series'
		});
		
		if (error) {
			console.log(`   ⚠️  Error saving series to Supabase: ${error.message}`);
		} else {
			console.log(`   💾 Saved series to Supabase -> ${baseName}`);
		}
	}

	const ctx = { seriesUrl, title: common.title, postId, baseName, common };
	seriesCache.set(seriesUrl, ctx);
	return ctx;
}

function extractPostId(seriesHtml) {
	const $ = cheerio.load(seriesHtml);
	const candidates = [];

	$('input#post_id, input#postId, input[name="post_id"], input[name="post"], [data-post-id], [data-post]').each((_, el) => {
		const attrs = [
			$(el).attr('value'),
			$(el).attr('data-post-id'),
			$(el).attr('data-post'),
			$(el).attr('data-id'),
		];
		for (const attr of attrs) {
			if (attr && /^\d+$/.test(attr.trim())) {
				candidates.push(parseInt(attr.trim(), 10));
			}
		}
	});

	const bodyClass = $('body').attr('class') || '';
	const bodyMatch = bodyClass.match(/postid-(\d+)/);
	if (bodyMatch) candidates.push(parseInt(bodyMatch[1], 10));

	if (candidates.length > 0) return candidates[0];

	const html = $.html();
	const regexes = [
		/post[_-]?id\s*[:=]\s*"?(\d+)"?/i,
		/"post"\s*:\s*"?(\d+)"?/i,
		/"post_id"\s*:\s*"?(\d+)"?/i,
		/\bpost\s*=\s*(\d+)/i,
		/postID\s*=\s*['"](\d+)['"]/i,
		/var\s+postId\s*=\s*(\d+)/i,
	];
	for (const regex of regexes) {
		const match = html.match(regex);
		if (match && match[1]) return parseInt(match[1], 10);
	}
	return null;
}

async function main() {
	PROXY_LIST = loadProxies();
	
	const args = process.argv.slice(2);
	const watchMode = args.includes('--watch');
	const printAll = args.includes('--all');
	const saveMode = args.includes('--save');
	let url = args.find((arg) => !arg.startsWith('--'));

	if (watchMode) {
		startWatcher();
		return;
	}

	if (!url) {
		url = HOME_URL;
	}
	console.log(`🔎 Fetching: ${url}`);
	const html = await fetchHtmlWithRetry(url);

	if (!/\/episode\//.test(url)) {
		const eps = filterRelevantHomepageEntries(extractHomepageEpisodeCards(html));
		console.log(`🧩 Found ${eps.length} item(s) on page`);
		const list = printAll ? eps : eps.slice(0, 10);
		list.forEach((e, i) => {
			console.log(
				`${String(i + 1).padStart(2, '0')}. ${e.title} -> ${e.url}${e.thumbnail ? ` [thumb: ${e.thumbnail}]` : ''} (context: ${e.context}; location: ${e.location})`
			);
		});
		if (!printAll && eps.length > list.length) {
			console.log(`… ${eps.length - list.length} more item(s) hidden. Run with --all to show everything.`);
		}
		return;
	}

	if (saveMode) {
		await handleEpisodeCard({ url }, { verbose: true });
		return;
	}

	const raw = extractIframeEmbeds(html);
	console.log(`🧩 Found ${raw.length} iframe(s) (before resolve)`);
	const resolved = await resolveEmbeds(raw);
	console.log(`\n🎬 Video Sources:`);
	resolved.forEach((r) => {
		console.log(` - option=${r.option ?? 'n/a'} -> ${r.url}`);
	});
}

main().catch((e) => {
	console.error('❌ Error:', e.message);
	process.exit(1);
});

async function fetchSeasonEpisodesViaAjax(postId, seasonNumber, refererUrl = HOME_URL, retries = CONFIG.maxRetries) {
	let lastErr = null;
	const totalAttempts = retries * Math.max(1, PROXY_LIST.length);
	
	for (let attempt = 1; attempt <= totalAttempts; attempt++) {
		try {
			const payload = new URLSearchParams();
			payload.append('action', 'action_select_season');
			payload.append('season', String(seasonNumber));
			payload.append('post', String(postId));

			const axiosConfig = {
				timeout: CONFIG.timeout,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					'User-Agent': getUA(),
					Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					Referer: refererUrl,
					Origin: 'https://toonstream.love',
					'X-Requested-With': 'XMLHttpRequest',
				},
			};
			
			const proxyString = getNextProxy();
			if (proxyString) {
				axiosConfig.httpsAgent = createProxyAgent(proxyString);
				axiosConfig.httpAgent = createProxyAgent(proxyString);
			}

			const res = await axios.post('https://toonstream.love/wp-admin/admin-ajax.php', payload.toString(), axiosConfig);

			let html = res?.data;
			if (html == null) throw new Error('Empty season response');
			if (typeof html === 'object') {
				if (typeof html.data === 'string') html = html.data;
				else if (typeof html.html === 'string') html = html.html;
				else html = JSON.stringify(html);
			}
			html = String(html);
			if (!html.trim()) throw new Error('Season response empty');
			return html;
		} catch (err) {
			lastErr = err;
			if (attempt < totalAttempts) await delay(1000);
		}
	}
	throw new Error(`Season AJAX failed after ${totalAttempts} attempts: ${lastErr?.message || 'unknown error'}`);
}

function extractEpisodesFromSeason(seasonHtml) {
	const $ = cheerio.load(seasonHtml);
	const episodes = [];
	const seen = new Set();

	$('#episode_by_temp a, ul#episode_by_temp li article a').each((_, el) => {
		const href = normalizeUrl($(el).attr('href'));
		if (!href || !href.includes('/episode/')) return;
		if (seen.has(href)) return;
		seen.add(href);
		const title = ($(el).text().trim() || $(el).find('.entry-title').text().trim() || '').replace(/\s+/g, ' ');
		const img =
			$(el).find('img[loading="lazy"]').attr('data-src') ||
			$(el).find('img').attr('data-src') ||
			$(el).find('img').attr('data-lazy-src') ||
			$(el).find('img').attr('src') ||
			null;
		episodes.push({ url: href, title, image: normalizeUrl(img) });
	});

	if (episodes.length === 0) {
		$('a[href*="/episode/"]').each((index, el) => {
			const href = normalizeUrl($(el).attr('href'));
			if (!href || seen.has(href)) return;
			seen.add(href);
			let title = $(el).text().trim();
			if (!title) title = $(el).attr('title')?.trim() || `Episode ${index + 1}`;
			let img =
				$(el).find('img').attr('data-src') ||
				$(el).find('img').attr('src') ||
				$(el).closest('li, article').find('img').attr('data-src') ||
				$(el).closest('li, article').find('img').attr('src') ||
				null;
			episodes.push({ url: href, title, image: normalizeUrl(img) });
		});
	}

	return episodes;
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function episodeExistsInSupabase(seriesCtx, seasonNumber, episodeNumber) {
	const { data } = await supabase
		.from('episodes')
		.select('id')
		.eq('series_slug', seriesCtx.baseName)
		.eq('season', seasonNumber)
		.eq('episode', episodeNumber)
		.single();
	
	return !!data;
}

function buildEpisodePayload(seriesCtx, seasonNumber, episodeNumber, episodeData, fallbackImage) {
	return {
		series_slug: seriesCtx.baseName,
		season: seasonNumber,
		episode: episodeNumber,
		episode_title: episodeData.title || null,
		thumbnail: seriesCtx.common.thumbnail || null,
		episode_main_poster: episodeData.mainPoster || null,
		episode_card_thumbnail: fallbackImage || null,
		episode_list_thumbnail: fallbackImage || null,
		video_player_thumbnail: episodeData.videoPoster || null,
		servers: episodeData.embeds.map((e) => ({ option: e.option, real_video: e.url || null })),
	};
}

async function saveEpisodeToSupabase(seriesCtx, seasonNumber, episodeNumber, payload) {
	const { error } = await supabase
		.from('episodes')
		.upsert(payload, { 
			onConflict: 'series_slug,season,episode'
		});
	
	if (error) {
		console.log(`      ⚠️  Error saving episode: ${error.message}`);
	} else {
		const episodeKey = `${seriesCtx.baseName}|S${seasonNumber}E${episodeNumber}`;
		processedEpisodes.add(episodeKey);
		console.log(`      💾 Saved to Supabase: ${seriesCtx.baseName} S${seasonNumber}E${episodeNumber}`);
		await updateLatestEpisodesInSupabase(seriesCtx, seasonNumber, episodeNumber, payload);
	}
}

async function fetchEpisodeDetailsForSaving(episodeUrl) {
	const html = await fetchHtmlWithRetry(episodeUrl);
	const $ = cheerio.load(html);
	const title =
		$('meta[property="og:title"]').attr('content')?.trim() ||
		$('h1.entry-title').first().text().trim() ||
		$('title').first().text().trim() ||
		'Episode';

	const mainPoster = extractEpisodeMainPoster(html);
	const rawEmbeds = extractIframeEmbeds(html);
	const resolvedEmbeds = await resolveEmbeds(rawEmbeds);

	return {
		title,
		mainPoster,
		embeds: resolvedEmbeds,
		videoPoster: null,
	};
}

async function fetchAndStoreSeason(seriesCtx, seasonNumber) {
	const lockKey = `${seriesCtx.seriesUrl}|${seasonNumber}`;
	if (seasonLocks.has(lockKey)) return { success: false, saved: 0 };
	seasonLocks.add(lockKey);
	let savedCount = 0;
	let fetchSuccess = false;
	try {
		console.log(`   🔄 Checking Season ${seasonNumber} for missing episodes...`);
		const seasonHtml = await fetchSeasonEpisodesViaAjax(seriesCtx.postId, seasonNumber, seriesCtx.seriesUrl);
		const episodes = extractEpisodesFromSeason(seasonHtml);
		if (episodes.length === 0) {
			console.log(`   ⚠️  Season ${seasonNumber} returned no episodes via AJAX.`);
			return { success: true, saved: 0 };
		}
		fetchSuccess = true;
		for (let index = 0; index < episodes.length; index++) {
			const ep = episodes[index];
			const parsed = parseEpisodeCode(ep.url);
			const episodeNumber = parsed?.episode ?? index + 1;
			const seasonInUrl = parsed?.season ?? seasonNumber;
			if (seasonInUrl !== seasonNumber) continue;
			
			const exists = await episodeExistsInSupabase(seriesCtx, seasonNumber, episodeNumber);
			if (exists) continue;

			console.log(`      ⏳ Fetching S${seasonNumber}E${episodeNumber}: ${ep.title || ep.url}`);
			const details = await fetchEpisodeDetailsForSaving(ep.url);
			const payload = buildEpisodePayload(seriesCtx, seasonNumber, episodeNumber, details, ep.image || null);
			await saveEpisodeToSupabase(seriesCtx, seasonNumber, episodeNumber, payload);
			savedCount++;
		}
		return { success: true, saved: savedCount };
	} catch (err) {
		console.log(`   ⚠️  Failed to update Season ${seasonNumber}: ${err.message}`);
		return { success: false, saved: savedCount };
	} finally {
		seasonLocks.delete(lockKey);
	}
}

async function getExistingEpisodesInSeason(seriesCtx, seasonNumber) {
	const { data, error } = await supabase
		.from('episodes')
		.select('episode')
		.eq('series_slug', seriesCtx.baseName)
		.eq('season', seasonNumber)
		.order('episode', { ascending: true });
	
	if (error || !data) return [];
	return data.map(e => e.episode);
}

function findMissingEpisodes(existingEpisodes) {
	if (existingEpisodes.length === 0) return [];
	
	const max = Math.max(...existingEpisodes);
	const min = Math.min(...existingEpisodes);
	const missing = [];
	const episodeSet = new Set(existingEpisodes);
	
	for (let i = min; i <= max; i++) {
		if (!episodeSet.has(i)) {
			missing.push(i);
		}
	}
	
	return missing;
}

async function ensureSeasonBackfilled(seriesCtx, seasonNumber, force = false) {
	const checkKey = `${seriesCtx.baseName}|S${seasonNumber}`;
	
	const lastCheck = seasonBackfillChecked.get(checkKey);
	if (!force && lastCheck && (Date.now() - lastCheck) < BACKFILL_COOLDOWN_MS) {
		return;
	}
	
	const existing = await getExistingEpisodesInSeason(seriesCtx, seasonNumber);
	const existingCount = existing.length;
	
	if (existingCount === 0) {
		console.log(`   🔍 Season ${seasonNumber} has no episodes, attempting to fetch...`);
	} else {
		const missing = findMissingEpisodes(existing);
		if (missing.length > 0) {
			console.log(`   🔍 Found ${missing.length} missing episodes in S${seasonNumber}: ${missing.join(', ')}`);
		}
	}
	
	const result = await fetchAndStoreSeason(seriesCtx, seasonNumber);
	
	if (!result.success) {
		console.log(`   ⚠️  Season ${seasonNumber} fetch failed, will retry on next check`);
		return;
	}
	
	const afterFetch = await getExistingEpisodesInSeason(seriesCtx, seasonNumber);
	const afterCount = afterFetch.length;
	const afterMissing = findMissingEpisodes(afterFetch);
	
	if (afterCount === 0) {
		if (existingCount === 0) {
			console.log(`   ⚠️  Season ${seasonNumber} fetch returned no episodes - will retry on next check`);
		}
	} else if (result.saved > 0) {
		console.log(`   ✅ Added ${result.saved} new episodes for Season ${seasonNumber} (now has ${afterCount} total)`);
		if (afterMissing.length > 0) {
			console.log(`   ⚠️  Season ${seasonNumber} still has ${afterMissing.length} missing episodes, will retry`);
		} else {
			seasonBackfillChecked.set(checkKey, Date.now());
		}
	} else if (afterMissing.length === 0) {
		seasonBackfillChecked.set(checkKey, Date.now());
	}
}

async function ensureSeasonsUpTo(seriesCtx, targetSeason) {
	for (let season = 1; season <= targetSeason; season++) {
		await ensureSeasonBackfilled(seriesCtx, season);
	}
}

async function checkAndBackfillMissingEpisodes(seriesCtx, seasonNumber) {
	await ensureSeasonBackfilled(seriesCtx, seasonNumber);
}

async function handleEpisodeCard(entry, { verbose = true } = {}) {
	const code = parseEpisodeCode(entry.url);
	if (!code) return;

	try {
		const { seriesUrl, seriesTitle } = await fetchEpisodeContext(entry.url);
		if (!seriesUrl) {
			if (verbose) console.log(`⚠️  Series URL not found for ${entry.url}`);
			return;
		}
		const targetSeason = seriesHighestSeasons.get(seriesUrl) || code.season;
		
		if (code.season < targetSeason) {
			if (verbose) console.log(`⏭️  Skipping S${code.season}E${code.episode} (current season is ${targetSeason})`);
			return;
		}
		
		const seriesCtx = await ensureSeriesInSupabase(seriesUrl, seriesTitle);
		
		await ensureSeasonsUpTo(seriesCtx, code.season);
		
		const exists = await episodeExistsInSupabase(seriesCtx, code.season, code.episode);
		if (!exists) {
			console.log(`📥 New episode detected: ${seriesCtx.title} S${code.season}E${code.episode} - forcing fetch`);
			await ensureSeasonBackfilled(seriesCtx, code.season, true);
		} else {
			if (verbose) console.log(`✅ Already saved S${code.season}E${code.episode} in Supabase`);
		}
	} catch (err) {
		console.log(`⚠️  Failed to process ${entry.url}: ${err.message}`);
	}
}

async function scanHomepageForWatcher() {
	const html = await fetchHtmlWithRetry(HOME_URL);
	const episodes = filterRelevantHomepageEntries(extractHomepageEpisodeCards(html)).slice(0, 30);
	if (episodes.length === 0) {
		console.log('ℹ️  No matching episode cards found in target widget.');
		return;
	}
	
	const tempSeasonMap = new Map();
	for (const entry of episodes) {
		const code = parseEpisodeCode(entry.url);
		if (!code) continue;
		const seriesUrl = deriveSeriesUrlFromEpisode(entry.url);
		if (!seriesUrl) continue;
		
		const currentMax = tempSeasonMap.get(seriesUrl) || 0;
		if (code.season > currentMax) {
			tempSeasonMap.set(seriesUrl, code.season);
		}
	}
	
	for (const [seriesUrl, highestSeason] of tempSeasonMap.entries()) {
		const existing = seriesHighestSeasons.get(seriesUrl) || 0;
		if (highestSeason > existing) {
			seriesHighestSeasons.set(seriesUrl, highestSeason);
		}
	}
	
	for (const entry of episodes) {
		await handleEpisodeCard(entry);
	}
}

function startWatcher() {
	PROXY_LIST = loadProxies();
	console.log('🚀 Episode watcher started (polling every 3 seconds)...');
	let running = false;
	const tick = async () => {
		if (running) return;
		running = true;
		try {
			await scanHomepageForWatcher();
		} catch (err) {
			console.log(`⚠️  Watcher tick failed: ${err.message}`);
		} finally {
			running = false;
		}
	};
	tick();
	setInterval(tick, POLL_INTERVAL_MS);
}

function filterRelevantHomepageEntries(entries) {
	return entries.filter((e) => e.location && e.location.includes('article.post.dfx.fcl.episodes.fa-play-circle'));
}

function deriveSeriesUrlFromEpisode(episodeUrl) {
	try {
		const u = new URL(episodeUrl);
		const parts = u.pathname.split('/').filter(Boolean);
		const episodeSlug = parts[1] || parts[parts.length - 1] || '';
		if (!episodeSlug) return null;
		const baseSlug = episodeSlug.replace(/-\d+x\d+$/i, '') || episodeSlug;
		return `${HOME_URL}series/${baseSlug}/`;
	} catch {
		return null;
	}
}

async function updateLatestEpisodesInSupabase(seriesCtx, seasonNumber, episodeNumber, episodePayload) {
	const episodeThumbnail = episodePayload.episode_card_thumbnail || 
	                         episodePayload.episode_list_thumbnail || 
	                         episodePayload.thumbnail || 
	                         seriesCtx.common.thumbnail || 
	                         null;
	
	const { data: existing } = await supabase
		.from('latest_episodes')
		.select('id')
		.eq('series_slug', seriesCtx.baseName)
		.eq('season', seasonNumber)
		.eq('episode', episodeNumber)
		.single();
	
	if (existing) {
		return;
	}
	
	await supabase.from('latest_episodes').insert({
		series_slug: seriesCtx.baseName,
		series_title: seriesCtx.title,
		season: seasonNumber,
		episode: episodeNumber,
		episode_title: episodePayload.episode_title,
		thumbnail: episodeThumbnail
	});
	
	const { data: allLatest } = await supabase
		.from('latest_episodes')
		.select('id')
		.order('added_at', { ascending: false })
		.range(9, 1000);
	
	if (allLatest && allLatest.length > 0) {
		const idsToDelete = allLatest.map(e => e.id);
		await supabase
			.from('latest_episodes')
			.delete()
			.in('id', idsToDelete);
	}
}
