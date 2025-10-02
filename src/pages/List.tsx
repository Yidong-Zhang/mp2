import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchCharacters, type Character } from '../API/marvel';
import styles from './List.module.css';

export default function List() {
    const [q, setQ] = useState('');
    const [items, setItems] = useState<Character[]>([]);
    const [sortBy, setSortBy] = useState<'name' | 'id'>('name');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        searchCharacters(q).then(res => setItems(res.results));
    }, [q]);

    const sorted = [...items].sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;
        if (sortBy === 'name') {
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
        } else {
            aVal = a.id;
            bVal = b.id;
        }
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className={styles.page}>
        <div className={styles.card}>
            <h2 className={styles.title}>Characters</h2>
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
                        className={styles.link}
                        to={`/detail/${c.id}`}
                        state={{ ids: sorted.map(x => x.id), index: idx }}
                    >
                        {c.name} (id: {c.id})
                    </Link>
                    </li>
                ))}
            </ul>
        </div>
        </div>
    );
}
