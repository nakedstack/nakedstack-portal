'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageTree } from '@/lib/hooks/usePageTree';

/** Redirects to the first root page, or shows a welcome state if none exist. */
export default function PagesIndex() {
  const router = useRouter();
  const { tree, loading, createPage } = usePageTree();

  useEffect(() => {
    if (loading) return;
    if (tree.length > 0) {
      router.replace(`/pages/${tree[0].id}`);
    }
  }, [tree, loading, router]);

  async function handleCreate() {
    const page = await createPage({ title: 'Getting Started' });
    router.push(`/pages/${page.id}`);
  }

  if (loading) return <div className="pages-index__loading">Loading…</div>;

  return (
    <div className="pages-index">
      <h1>Welcome to Nakedstack</h1>
      <p>You have no pages yet.</p>
      <button className="pages-index__cta" onClick={handleCreate}>
        Create your first page
      </button>
    </div>
  );
}
