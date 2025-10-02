import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { getCharacterById, type Character } from '../API/marvel';

type NavState = { ids?: number[]; index?: number };

export default function Detail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { ids = [], index = -1 } = (location.state as NavState) || {};
    const hasOrder = ids.length > 0 && index >= 0;

    const [data, setData] = useState<Character | null>(null);

    useEffect(() => {
        const n = Number(id);
        if (!Number.isFinite(n)) return;
        getCharacterById(n).then(setData);
    }, [id]);

    const go = (delta: number) => {
        if (!hasOrder) return;
        const nextIndex = (index + delta + ids.length) % ids.length;
        const nextId = ids[nextIndex];
        navigate(`/detail/${nextId}`, { state: { ids, index: nextIndex } });
};

const externalUrl =
    data?.urls?.find(u => u.type === 'wiki')?.url ||
    data?.urls?.find(u => u.type === 'detail')?.url ||
    data?.urls?.find(u => u.type === 'comiclink')?.url;

const safeUrl = externalUrl || `https://www.marvel.com/search?search=${encodeURIComponent(data?.name || '')}`;

  return (
    <div>
        <p><button onClick={() => navigate(-1)}>← back</button></p>
        {!data && <p>Loading…</p>}
        {data && (
            <>
            <h2>{data.name}</h2>

            {data.description ? (
                <p>{data.description}</p>
            ) : (
                <p>
                    No description.{' '}
                    <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                        View on Marvel.com
                    </a>
                </p>
            )}

            <div>
                <button onClick={() => go(-1)} disabled={!hasOrder}>Prev</button>
                <button onClick={() => go(1)}  disabled={!hasOrder}>Next</button>
            </div>
            </>
        )}
    </div>
  );
}
