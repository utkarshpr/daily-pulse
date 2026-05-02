import React, { useEffect, useMemo, useState } from 'react';
import { Newspaper, RefreshCw, ExternalLink, Filter, Play, Search, Globe, Trophy, Car, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { cn } from '../lib/utils';

const isNative = () => Capacitor?.isNativePlatform?.() === true;

// On native, the in-app webview cannot follow target="_blank" and the codetabs
// CORS proxy is flaky; CapacitorHttp lets us hit YouTube directly. On web we
// keep the proxy because browsers enforce CORS on the YouTube feed host.
const openExternal = async (url) => {
  if (!url) return;
  if (isNative()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

// Two free, no-backend sources:
//   1. The Guardian Open Platform — uses the literal `test` key for casual
//      use (no sign-up). CORS-enabled. Required attribution.
//   2. YouTube channel Atom feeds via the existing codetabs proxy. No key,
//      no quota. Categories aggregate verified channels in parallel.
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_KEY = 'dp.news.cache.v1';
const PROXY = 'https://api.codetabs.com/v1/proxy?quest=';
const GUARDIAN_KEY = 'test';

const GUARDIAN_SECTIONS = [
  { id: '', label: 'Top stories' },
  { id: 'world', label: 'World' },
  { id: 'technology', label: 'Technology' },
  { id: 'science', label: 'Science' },
  { id: 'business', label: 'Business' },
  { id: 'sport', label: 'Sport' },
  { id: 'culture', label: 'Culture' },
  { id: 'environment', label: 'Environment' },
];

// Each category aggregates a small, verified channel set so a single click
// gives breadth without the user managing per-channel selection. Channel IDs
// were probed live; bad ones get dropped silently if they ever 404.
const VIDEO_CATEGORIES = [
  {
    id: 'news',
    label: 'News',
    icon: Newspaper,
    accent: 'from-violet-500 to-cyan-500',
    channels: [
      { id: 'UCwqusr8YDwM-3mEYTDeJHzw', name: 'NDTV' },
      { id: 'UCt4t-jeY85JegMlZ-E5UWtA', name: 'Aaj Tak' },
      { id: 'UCYPvAwZP8pZhSMW8qs7cVCw', name: 'India Today' },
      { id: 'UC16niRr50-MSBwiO3YDb3RA', name: 'BBC News' },
    ],
  },
  {
    id: 'auto',
    label: 'Auto',
    icon: Car,
    accent: 'from-orange-500 to-rose-500',
    channels: [
      { id: 'UCO-uVs959_GUzzUx4ctwMMQ', name: 'MotorInc' },
      { id: 'UCsqjHFMB_JYTaEnf_vmTNqg', name: 'Doug DeMuro' },
      { id: 'UCQMELFlXQL38KPm8kM-4Adg', name: 'MotorTrend' },
    ],
  },
  {
    id: 'sports',
    label: 'Sports',
    icon: Trophy,
    accent: 'from-emerald-500 to-teal-500',
    // Cricket-only by user request — covers every format the user cares
    // about: ODI/50-over (ICC, BCCI), T20 + World Cup (ICC), IPL (official
    // channel), plus daily news (ESPNcricinfo, Cricbuzz, Star Sports India).
    // General-sports channels (ESPN, Sky Sports News) intentionally dropped.
    channels: [
      { id: 'UCujuVKmt_utAQZJghxlRMIQ', name: 'ESPNcricinfo' },
      { id: 'UCt2JXOLNxqry7B_4rRZME3Q', name: 'ICC' },
      { id: 'UC8K-y-Td10jDxYTmtBrjv6g', name: 'IPL' },
      { id: 'UCSRQXk5yErn4e14vN76upOw', name: 'Cricbuzz' },
      { id: 'UC2iihojySb58j_Q4zL7VI5w', name: 'Star Sports India' },
      { id: 'UCXnFh8S94wQCPw-p6j6bX9A', name: 'BCCI' },
    ],
  },
  {
    id: 'world',
    label: 'World',
    icon: Globe,
    accent: 'from-sky-500 to-indigo-500',
    channels: [
      { id: 'UC16niRr50-MSBwiO3YDb3RA', name: 'BBC News' },
      { id: 'UChqUTb7kYRX8-EiaN3XFrSQ', name: 'Reuters' },
      { id: 'UCupvZG-5ko_eiXAupbDfxWw', name: 'CNN' },
      { id: 'UCNye-wNBqNL5ZzHSJj3l8Bg', name: 'Al Jazeera' },
      { id: 'UCQfwfsi5VrQ8yKZ-UWmAEFg', name: 'France 24' },
    ],
  },
];

const formatAge = (iso) => {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  return `${d}d`;
};

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeCache = (key, payload) => {
  try {
    const all = readCache();
    all[key] = { at: Date.now(), payload };
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {
    // Quota errors are fine to swallow — next refresh will refill.
  }
};

const fetchGuardian = async ({ section = '' }) => {
  const params = new URLSearchParams({
    'api-key': GUARDIAN_KEY,
    'show-fields': 'thumbnail,trailText',
    'page-size': '30',
    'order-by': 'newest',
  });
  if (section) params.set('section', section);
  const r = await fetch(`https://content.guardianapis.com/search?${params}`);
  if (!r.ok) throw new Error(`Guardian ${r.status}`);
  const data = await r.json();
  const results = data?.response?.results || [];
  return {
    items: results.map((it) => ({
      id: it.id,
      title: it.webTitle,
      url: it.webUrl,
      source: 'The Guardian',
      when: it.webPublicationDate,
      image: it.fields?.thumbnail,
      trail: it.fields?.trailText,
    })),
  };
};

const parseYouTubeAtom = (xml, channelName) => {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) return [];
  const entries = Array.from(doc.getElementsByTagName('entry'));
  return entries.map((entry) => {
    const videoId = entry.getElementsByTagName('yt:videoId')[0]?.textContent
      || entry.getElementsByTagNameNS('http://www.youtube.com/xml/schemas/2015', 'videoId')[0]?.textContent;
    const title = entry.getElementsByTagName('title')[0]?.textContent || '';
    const published = entry.getElementsByTagName('published')[0]?.textContent || '';
    const thumb = entry.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')[0]?.getAttribute('url')
      || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);
    const description = entry.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'description')[0]?.textContent || '';
    return {
      id: videoId || `${channelName}:${title}`,
      title,
      url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
      source: channelName,
      when: published,
      image: thumb,
      trail: description.slice(0, 200),
      isVideo: true,
    };
  }).filter((e) => e.url);
};

// Aggregate a category by fetching all its channel feeds in parallel, merging
// by published date, deduping by URL. Failures on individual channels degrade
// silently — the user still sees results from the channels that did respond.
const fetchVideoCategory = async (categoryId) => {
  const cat = VIDEO_CATEGORIES.find((c) => c.id === categoryId) || VIDEO_CATEGORIES[0];
  const fetches = cat.channels.map(async (ch) => {
    try {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`;
      const r = await fetch(isNative() ? feedUrl : PROXY + encodeURIComponent(feedUrl));
      if (!r.ok) return [];
      const xml = await r.text();
      return parseYouTubeAtom(xml, ch.name);
    } catch {
      return [];
    }
  });
  const settled = await Promise.all(fetches);
  const merged = settled.flat();
  const seen = new Set();
  const deduped = merged.filter((it) => {
    if (seen.has(it.url)) return false;
    seen.add(it.url);
    return true;
  });
  deduped.sort((a, b) => new Date(b.when) - new Date(a.when));
  return { items: deduped.slice(0, 40) };
};

const buildKey = (source, opts) => {
  if (source === 'guardian') return `guardian:${opts.section}`;
  if (source === 'youtube') return `youtube:${opts.category}`;
  return source;
};

// ---- Skeleton card shown while fetching --------------------------------------
function SkeletonCard() {
  return (
    <li className="card p-4 overflow-hidden relative">
      <div className="flex items-start gap-3">
        <div className="w-28 h-16 rounded-lg bg-slate-200/70 dark:bg-white/5 shrink-0 shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded bg-slate-200/70 dark:bg-white/5 shimmer" style={{ width: '85%' }} />
          <div className="h-3 rounded bg-slate-200/70 dark:bg-white/5 shimmer" style={{ width: '60%' }} />
          <div className="h-2 rounded bg-slate-200/60 dark:bg-white/5 shimmer mt-3" style={{ width: '40%' }} />
        </div>
      </div>
    </li>
  );
}

export default function News({ flash }) {
  const [source, setSource] = useState(() => localStorage.getItem('dp.news.source.v1') || 'guardian');
  const [section, setSection] = useState(() => {
    const saved = localStorage.getItem('dp.news.section.v1') || '';
    return GUARDIAN_SECTIONS.some((s) => s.id === saved) ? saved : '';
  });
  const [category, setCategory] = useState(() => {
    const saved = localStorage.getItem('dp.news.category.v1') || 'news';
    return VIDEO_CATEGORIES.some((c) => c.id === saved) ? saved : 'news';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [error, setError] = useState(null);

  const opts = useMemo(() => ({ section, category }), [section, category]);
  const cacheKey = buildKey(source, opts);

  useEffect(() => { localStorage.setItem('dp.news.source.v1', source); }, [source]);
  useEffect(() => { localStorage.setItem('dp.news.section.v1', section); }, [section]);
  useEffect(() => { localStorage.setItem('dp.news.category.v1', category); }, [category]);

  const load = async ({ force = false } = {}) => {
    setError(null);
    if (!force) {
      const cached = readCache()[cacheKey];
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        setItems(cached.payload.items || []);
        setLastFetched(cached.at);
        return;
      }
    }
    setLoading(true);
    try {
      const data = source === 'youtube'
        ? await fetchVideoCategory(category)
        : await fetchGuardian({ section });
      setItems(data.items);
      setLastFetched(Date.now());
      writeCache(cacheKey, data);
    } catch (e) {
      setError(e.message || 'Could not load news');
      flash?.('News fetch failed — wait a moment and try again', true);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [cacheKey]);

  // In-app filter: matches the query against title, source, and trail text of
  // whatever is currently loaded. No external request, no new-tab redirect.
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      (it.title || '').toLowerCase().includes(q)
      || (it.source || '').toLowerCase().includes(q)
      || (it.trail || '').toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Minimal header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">News</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Cached 30 min · opt-in.</p>
        </div>
        <button
          onClick={() => load({ force: true })}
          disabled={loading}
          className="btn-ghost text-xs disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw size={13} className={cn(loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* Source toggle — small, no gradients */}
      <div className="flex items-center gap-1.5">
        {[
          { id: 'guardian', label: 'Guardian', icon: Newspaper },
          { id: 'youtube', label: 'Video', icon: Play },
        ].map((s) => {
          const Icon = s.icon;
          const active = source === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                active
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                  : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white/20'
              )}
            >
              <span className="flex items-center gap-1.5">
                <Icon size={12} /> {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search — filters loaded items in place */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          className="input !pl-9 !pr-9 text-sm"
          placeholder={source === 'youtube' ? 'Filter videos…' : 'Filter headlines…'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-6 grid place-items-center text-slate-400 hover:text-slate-700 dark:hover:text-white rounded"
            aria-label="Clear filter"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filter chips — sections for Guardian, categories for Video */}
      {source === 'guardian' && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter size={12} />
          <select
            className="bg-transparent outline-none cursor-pointer font-medium"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          >
            {GUARDIAN_SECTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      )}

      {source === 'youtube' && (
        <div className="flex flex-wrap gap-1.5">
          {VIDEO_CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5',
                  active
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                    : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white/20'
                )}
              >
                <Icon size={12} /> {c.label}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="rounded-2xl p-4 border border-rose-300/40 bg-rose-500/5 text-sm text-rose-700 dark:text-rose-300 animate-pop-in">
          {error}
        </div>
      )}

      {/* Card grid */}
      {loading && items.length === 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
        </ul>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-500">
          {searchQuery
            ? `No matches for "${searchQuery}".`
            : 'Nothing to show — try a different category or refresh.'}
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filteredItems.map((it) => (
            <li
              key={it.id}
              className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/40 dark:bg-white/5 p-3 hover:border-slate-300 dark:hover:border-white/20 transition-colors"
            >
              <a
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (isNative()) {
                    e.preventDefault();
                    openExternal(it.url);
                  }
                }}
                className="flex items-start gap-3 group"
              >
                {it.image && (
                  <div className="relative shrink-0 overflow-hidden rounded-md">
                    <img
                      src={it.image}
                      alt=""
                      className={cn('object-cover', it.isVideo ? 'w-24 h-14' : 'size-14')}
                      loading="lazy"
                    />
                    {it.isVideo && (
                      <span className="absolute inset-0 grid place-items-center bg-black/30">
                        <Play size={14} className="text-white" fill="currentColor" />
                      </span>
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-snug line-clamp-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {it.title}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-medium text-slate-500 dark:text-slate-400">{it.source}</span>
                    <span className="ml-auto flex items-center gap-1">
                      {formatAge(it.when)}
                      <ExternalLink size={9} className="opacity-0 group-hover:opacity-100 transition" />
                    </span>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      {lastFetched && !loading && items.length > 0 && (
        <p className="text-[10px] text-slate-400 text-center">
          Last fetched {new Date(lastFetched).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
