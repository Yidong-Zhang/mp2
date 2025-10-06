import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchCharacters, type Character } from '../API/marvel';
import styles from './List.module.css';

export default function List() {
    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState(q); 
    const [items, setItems] = useState<Character[]>([]);
    const [sortBy, setSortBy] = useState<'name' | 'id'>('name');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q), 300);
        return () => clearTimeout(t);
    }, [q]);

    useEffect(() => {
        searchCharacters(debouncedQ).then(res => setItems(res.results));
    }, [debouncedQ]);

    const sorted = useMemo(() => {
        const arr = [...items];
        arr.sort((a, b) => {
        const aVal = sortBy === 'name' ? a.name.toLowerCase() : a.id;
        const bVal = sortBy === 'name' ? b.name.toLowerCase() : b.id;
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
        });
        return arr;
    }, [items, sortBy, order]);

    const ids = useMemo(() => sorted.map(x => x.id), [sorted]);

    return (
        <div className={styles.wrap}>
        <h2>Characters</h2>

        <nav className={styles.subnav}>
            <Link to="/">List</Link>
            <span>·</span>
            <Link to="/gallery">Gallery</Link>
        </nav>

        <div className={styles.controls}>
            <input
            placeholder="Search by name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            />
            <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'id')}
            >
            <option value="name">name</option>
            <option value="id">id</option>
            </select>
            <button onClick={() => setOrder(o => (o === 'asc' ? 'desc' : 'asc'))}>
            {order === 'asc' ? 'Asc' : 'Desc'}
            </button>
        </div>

        <ul className={styles.list}>
            {sorted.map((c, idx) => (
            <li key={c.id}>
                <Link
                    to={`/detail/${c.id}`}
                    className={styles.link}
                    state={{ ids: sorted.map(x => x.id), index: idx }}
                    >
                    {c.name} (id: {c.id})
                </Link>
            </li>
            ))}
        </ul>
        </div>
    );
}
