import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchCharacters, type Character } from '../API/marvel';
import styles from './Gallery.module.css';

const GALLERY_CACHE_KEY = 'gallery_state_v2';

type Group = 'AF' | 'GL' | 'MR' | 'SZ';
const LETTERS: Record<Group, string[]> = {
  AF: ['a','b','c','d','e','f'],
  GL: ['g','h','i','j','k','l'],
  MR: ['m','n','o','p','q','r'],
  SZ: ['s','t','u','v','w','x','y','z'],
};

function imgUrl(t?: { path: string; extension: string }, variant = 'portrait_xlarge') {
  if (!t?.path || !t?.extension) return '';
  return `${t.path}/${variant}.${t.extension}`;
}

export default function Gallery() {
    const [items, setItems] = useState<Character[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [needDesc, setNeedDesc] = useState(false);
    const [offsets, setOffsets] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const saved = sessionStorage.getItem(GALLERY_CACHE_KEY);
        if (!saved) return;
        try {
        const s = JSON.parse(saved);
        setItems(s.items ?? []);
        setGroups(s.groups ?? []);
        setNeedDesc(!!s.needDesc);
        setOffsets(s.offsets ?? {});
        } catch {}
    }, []);

    useEffect(() => {
        sessionStorage.setItem(
        GALLERY_CACHE_KEY,
        JSON.stringify({ items, groups, needDesc, offsets })
        );
    }, [items, groups, needDesc, offsets]);

    useEffect(() => {
        if (items.length > 0) return;
        (async () => {
        setLoading(true);
        const seeds = ['a','b','c','d','m','n','s','t','w','x'];
        const settled = await Promise.allSettled(
            seeds.map(l => searchCharacters(l, 0, 40))
        );
        const byId: Record<number, Character> = {};
        settled.forEach(r => {
            if (r.status === 'fulfilled') r.value.results.forEach(c => { byId[c.id] = c; });
        });
        setItems(Object.values(byId));
        setOffsets(prev => {
            const next = { ...prev };
            seeds.forEach(l => { next[l] = 40; });
            return next;
        });
        setLoading(false);
        })();
    }, [items.length]);

    const activeLetters: string[] =
        groups.length === 0 ? [] : groups.flatMap(g => LETTERS[g]);

    useEffect(() => {
        if (groups.length === 0) return;
        (async () => {
        setLoading(true);
        setOffsets(prev => {
            const next = { ...prev };
            activeLetters.forEach(l => { next[l] = 0; });
            return next;
        });
        const settled = await Promise.allSettled(
            activeLetters.map(l => searchCharacters(l, 0, 40))
        );
        const byId: Record<number, Character> = {};
        settled.forEach(r => {
            if (r.status === 'fulfilled') r.value.results.forEach(c => { byId[c.id] = c; });
        });
        setItems(Object.values(byId));
        setOffsets(prev => {
            const next = { ...prev };
            activeLetters.forEach(l => { next[l] = 40; });
            return next;
        });
        setLoading(false);
        })();
    }, [groups.join(',')]);

    const loadMore = async () => {
        if (loading || activeLetters.length === 0) return;
        setLoading(true);
        const tasks = activeLetters.map(l => {
        const off = offsets[l] ?? 0;
        return searchCharacters(l, off, 40).then(res => ({ letter: l, res }));
        });
        const settled = await Promise.allSettled(tasks);
        const byId: Record<number, Character> = {};
        items.forEach(c => { byId[c.id] = c; });
        const newOffsets: Record<string, number> = { ...offsets };
        settled.forEach(s => {
        if (s.status === 'fulfilled') {
            const { letter, res } = s.value;
            res.results.forEach(c => { byId[c.id] = c; });
            if (res.results.length > 0) newOffsets[letter] = (newOffsets[letter] ?? 0) + 40;
        }
        });
        setItems(Object.values(byId));
        setOffsets(newOffsets);
        setLoading(false);
    };

    const displayed = useMemo(() => {
        return items.filter(c => {
        const url = imgUrl(c.thumbnail);
        if (!url) return false;
        if (c.thumbnail?.path?.includes('image_not_available')) return false;
        if (groups.length > 0) {
            const ch = (c.name[0] || 'z').toLowerCase();
            if (!activeLetters.includes(ch)) return false;
        }
        if (needDesc && !(c.description || '').trim()) return false;
        return true;
        });
    }, [items, groups, activeLetters, needDesc]);

    const ids = displayed.map(x => x.id);
    const toggleGroup = (g: Group) =>
        setGroups(prev => (prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]));

  return (
    <div>
        <h2>Gallery</h2>
        <fieldset className={styles.filters}>
            <legend>Filter</legend>
            <label><input type="checkbox" checked={groups.includes('AF')} onChange={() => toggleGroup('AF')} /> A-F</label>{' '}
            <label><input type="checkbox" checked={groups.includes('GL')} onChange={() => toggleGroup('GL')} /> G-L</label>{' '}
            <label><input type="checkbox" checked={groups.includes('MR')} onChange={() => toggleGroup('MR')} /> M-R</label>{' '}
            <label><input type="checkbox" checked={groups.includes('SZ')} onChange={() => toggleGroup('SZ')} /> S-Z</label>{' '}
            <label><input type="checkbox" checked={needDesc} onChange={() => setNeedDesc(v => !v)} /> has description</label>
        </fieldset>

        <ul className={styles.grid}>
            {displayed.map((c, idx) => {
                const url = imgUrl(c.thumbnail);
                return (
                    <li key={c.id}>
                    <Link className={styles.card} to={`/detail/${c.id}`} state={{ ids, index: idx }}>
                        {url && <img className={styles.thumb} src={url} alt={c.name} />}
                        <div className={styles.name}>{c.name}</div>
                    </Link>
                    </li>
                );
            })}
        </ul>

      {groups.length > 0 && (
        <p>
        <button onClick={loadMore} disabled={loading}>
            {loading ? 'Loading…' : 'Load more'}
        </button>
        </p>
        )}
    </div>
    );
}
