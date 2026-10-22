import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { Button, EmptyState, Icon } from '@/ui';
import { LoadingBlocks, MiniTag, PageProblem } from '../ui';
import { pickArticle } from './helpView';
import h from './Help.module.css';

/** Hướng dẫn: a search box over the articles the person may see, and the chosen article beside the list. */
export function ArticlesTab() {
  const [params, setParams] = useSearchParams();
  const [typed, setTyped] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(typed.trim()), 250);
    return () => clearTimeout(t);
  }, [typed]);

  const all = useQuery(() => staff.help.articles(), []);
  // The result of an older search never shows: `useQuery` keeps data only for the query it was asked for.
  const found = useQuery(() => staff.help.search(query), [query]);
  const ids = (all.data ?? []).map((a) => a.id);
  const asked = params.get('bai');
  const openId = pickArticle(asked, ids);
  const article = all.data?.find((a) => a.id === openId);

  useEffect(() => {
    if (all.data && asked && !openId) {
      const next = new URLSearchParams(params);
      next.delete('bai');
      setParams(next, { replace: true });
    }
  }, [all.data, asked, openId, params, setParams]);

  if (all.error && !all.data) return <PageProblem error={all.error} onRetry={all.refetch} />;
  if (!all.data) return <LoadingBlocks rows={3} />;
  const list = found.data ?? all.data;
  const open = (id: string | undefined) => {
    const next = new URLSearchParams(params);
    if (id) next.set('bai', id); else next.delete('bai');
    setParams(next);
  };
  const toFeedback = () => setParams({ tab: 'gop-y' });

  const listView = (
    <div className={h.listCol}>
      <div role="search" className={h.searchBox}>
        <Icon name="search" size={18} />
        <input type="search" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Gõ điều bạn muốn làm, ví dụ: thu tiền" aria-label="Tìm trong hướng dẫn" />
      </div>
      <p className={h.count} role="status">{list.length > 0 ? `Có ${list.length} bài.` : 'Chưa có bài nào khớp. Thử từ khác, hoặc hỏi Quản lý ở tab Góp ý.'}</p>
      {list.length === 0 ? (
        <EmptyState icon="lifebuoy" title="Chưa có bài nào khớp" body="Thử từ khác, hoặc hỏi Quản lý ở tab Góp ý." action={<Button icon="message-circle" onClick={toFeedback}>Hỏi hoặc góp ý</Button>} />
      ) : (
        <ul className={h.articles}>
          {list.map((a) => (
            <li key={a.id}>
              <button type="button" className={h.articleCard} data-article aria-current={a.id === openId ? 'true' : undefined} onClick={() => open(a.id)}>
                <span className={h.articleTitle}>{a.title}</span>
                <span className={h.articleSummary}>{a.summary}</span>
                <MiniTag>{a.badge}</MiniTag>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className={`${h.split} ${article ? h.hasArticle : ''}`}>
      {listView}
      {article && (
        <article className={h.article} data-article-body aria-labelledby="bai-tieu-de">
          <Button variant="ghost" size="sm" icon="arrow-left" className={h.backBtn} onClick={() => open(undefined)}>Danh sách bài</Button>
          <h2 id="bai-tieu-de" className={h.articleH}>{article.title}</h2>
          <p className={h.articleLead}>{article.summary}</p>
          <ol className={h.steps}>{article.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <MiniTag>{article.badge}</MiniTag>
        </article>
      )}
    </div>
  );
}
