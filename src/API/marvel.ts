import axios from 'axios';
import md5 from 'blueimp-md5';

const PUBLIC_KEY  = process.env.REACT_APP_MARVEL_PUBLIC_KEY || '';
const PRIVATE_KEY = process.env.REACT_APP_MARVEL_PRIVATE_KEY || '';
const USE_MOCK    = process.env.REACT_APP_USE_MOCK === 'true';

export type Character = {
    id: number;
    name: string;
    description: string;
    thumbnail?: { path: string; extension: string };
    urls?: { type: string; url: string }[];
};


const api = axios.create({
    baseURL: 'https://gateway.marvel.com/v1/public',
    timeout: 20000,
});

function authParams() {
    const ts = Date.now().toString();
    const hash = md5(ts + PRIVATE_KEY + PUBLIC_KEY);
    return { ts, apikey: PUBLIC_KEY, hash };
}

const mock: Character[] = [
    {
        id: 1009368,
        name: 'Iron Man',
        description: 'Genius, billionaire, playboy, philanthropist.',
        thumbnail: {
        path: 'https://i.annihil.us/u/prod/marvel/i/mg/9/c0/527bb7b37ff55',
        extension: 'jpg',
        },
    },
    {
        id: 1009610,
        name: 'Spider-Man',
        description: 'Friendly neighborhood wall-crawler.',
        thumbnail: {
        path: 'https://i.annihil.us/u/prod/marvel/i/mg/3/20/5232158de5b16',
        extension: 'jpg',
        },
    },
];

const mem = new Map<string, any>();
const keyOf = (q: string, o: number, l: number) =>
    `search:${(q || '').toLowerCase()}|${o}|${l}`;

export async function searchCharacters(
    query: string,
    offset = 0,
    limit = 20,
    signal?: AbortSignal
    ): Promise<{ total: number; count: number; results: Character[] }> {
  
    if (USE_MOCK || !PUBLIC_KEY || !PRIVATE_KEY) {
        const list = mock.filter(m =>
        m.name.toLowerCase().includes((query || '').toLowerCase())
        );
        return {
        total: list.length,
        count: Math.max(0, Math.min(limit, list.length - offset)),
        results: list.slice(offset, offset + limit),
        };
    }

    const cacheKey = keyOf(query, offset, limit);
    if (mem.has(cacheKey)) return mem.get(cacheKey);
    const stored = sessionStorage.getItem(cacheKey);
    if (stored) {
        const parsed = JSON.parse(stored);
        mem.set(cacheKey, parsed);
        return parsed;
    }

    const params: Record<string, any> = {
        ...authParams(),
        limit,
        offset,
        orderBy: 'name',
    };
    if (query) params.nameStartsWith = query;

    const { data } = await api.get('/characters', { params, signal });
    const box = data?.data;
    const arr: any[] = Array.isArray(box?.results) ? box.results : [];
    const result = {
        total: Number(box?.total ?? arr.length),
        count: Number(box?.count ?? arr.length),
        results: arr.map(toCharacter),
    };

    mem.set(cacheKey, result);
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
}

export async function getCharacterById(
    id: number,
    signal?: AbortSignal
    ): Promise<Character | null> {
    if (USE_MOCK || !PUBLIC_KEY || !PRIVATE_KEY) {
        return mock.find(x => x.id === id) ?? null;
    }
    const { data } = await api.get(`/characters/${id}`, {
        params: authParams(),
        signal,
    });
    const arr: any[] = data?.data?.results ?? [];
    return arr.length ? toCharacter(arr[0]) : null;
}

function toCharacter(x: any): Character {
    return {
        id: Number(x?.id),
        name: String(x?.name ?? ''),
        description: String(x?.description ?? ''),
        thumbnail: x?.thumbnail,
        urls: Array.isArray(x?.urls) ? x.urls : undefined,
    };
}

export function imageUrl(
    t?: { path: string; extension: string },
    variant = 'portrait_xlarge'
    ): string {
    if (!t?.path || !t?.extension) return '';
    return `${t.path}/${variant}.${t.extension}`;
}
