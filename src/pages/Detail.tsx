import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getCharacterById, type Character } from '../API/marvel';
import styles from './Detail.module.css';

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
    if (Number.isFinite(n)) {
      getCharacterById(n).then(setData);
    }
  }, [id]);

  const go = (delta: number) => {
    if (!hasOrder) return;
    const nextIndex = (index + delta + ids.length) % ids.length;
    const nextId = ids[nextIndex];
    navigate(`/detail/${nextId}`, { state: { ids, index: nextIndex } });
  };

  const detailUrl = data?.urls?.find(u => u.type === 'detail')?.url;

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate(-1)}>← back</button>

      {!data ? (
        <p className={styles.loading}>Loading…</p>
      ) : (
        <>
          <div className={styles.detailWrap}>
            <h2>{data.name}</h2>
            {data.description ? (
              <p>{data.description}</p>
            ) : (
              <p>No description.</p>
            )}

            {detailUrl && (
              <p>
                <a className={styles.link} href={detailUrl} target="_blank" rel="noopener noreferrer">
                  View on Marvel.com
                </a>
              </p>
            )}
          </div>

          <div className={styles.navBtns}>
            <button onClick={() => go(-1)} disabled={!hasOrder}>Prev</button>
            <button onClick={() => go(1)}  disabled={!hasOrder}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
