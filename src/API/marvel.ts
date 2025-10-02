import axios from 'axios';
import md5 from 'blueimp-md5';

const PUBLIC_KEY = process.env.REACT_APP_MARVEL_PUBLIC_KEY || '';
const PRIVATE_KEY = process.env.REACT_APP_MARVEL_PRIVATE_KEY || '';
const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true';

export type Character = {
    id: number;
    name: string;
    description: string;
    thumbnail?: { path: string; extension: string };
    urls?: { type: string; url: string }[];
};

const api = axios.create({
    baseURL: 'https://gateway.marvel.com/v1/public',
    timeout: 30000,
});

function authParams() {
    const ts = Date.now().toString();
    const hash = md5(ts + PRIVATE_KEY + PUBLIC_KEY);
    return { ts, apikey: PUBLIC_KEY, hash };
}

function toCharacter(x: any): Character {
    return {
        id: x?.id,
        name: x?.name ?? '',
        description: (x?.description || '').trim(),
        thumbnail: x?.thumbnail,
        urls: Array.isArray(x?.urls) ? x.urls : undefined,
    };
}

export async function searchCharacters(
    query: string,
    offset = 0,
    limit = 20
    ): Promise<{ total: number; count: number; results: Character[] }> {
        if (USE_MOCK || !PUBLIC_KEY || !PRIVATE_KEY) {
            return { total: 0, count: 0, results: [] };
        }
        const q = query?.trim();
        const params = {
            ...authParams(),
            nameStartsWith: q ? q : undefined,
            limit,
            offset,
            orderBy: 'name',
        };
        const { data } = await api.get('/characters', { params });
        const box = data?.data;
        const results = Array.isArray(box?.results) ? box.results.map(toCharacter) : [];
        return {
            total: Number(box?.total ?? results.length),
            count: Number(box?.count ?? results.length),
            results,
        };
    }

export async function getCharacterById(id: number): Promise<Character | null> {
    if (USE_MOCK || !PUBLIC_KEY || !PRIVATE_KEY) {
        return null;
    }
    const { data } = await api.get(`/characters/${id}`, { params: authParams() });
    const arr = data?.data?.results ?? [];
    return arr.length ? toCharacter(arr[0]) : null;
}

export function imageUrl(
    t?: { path: string; extension: string },
    variant = 'standard_xlarge'
    ): string | undefined {
        if (!t?.path || !t?.extension) return undefined;
        return `${t.path}/${variant}.${t.extension}`;
    }
