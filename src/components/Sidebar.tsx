'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useNav } from '@/lib/nav-context';
import { getTopics, deleteTopic, type SavedTopic } from '@/lib/storage';
import ContextMenu from '@/components/ContextMenu';
import { Plus, DotsThreeVertical, ArrowSquareOut, PencilSimple, Trash } from '@phosphor-icons/react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen: open, setSidebarOpen: setOpen } = useNav();
  const [topics, setTopics] = useState<SavedTopic[]>([]);

  const loadTopics = async () => {
    try {
      const t = await getTopics();
      setTopics(t);
    } catch {
      // DB not available yet — will retry on next poll
    }
  };

  useEffect(() => {
    loadTopics();
    const interval = setInterval(loadTopics, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleNewTopic = () => {
    setOpen(false);
    router.push('/studio');
  };

  const handleTopicClick = (id: string) => {
    router.push(`/studio?topic=${id}`);
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTopic(id);
    loadTopics();
  };

  const handleRename = async (id: string) => {
    const newTitle = prompt('Nuovo nome:', topics.find(t => t.id === id)?.title || '');
    if (newTitle && newTitle.trim()) {
      const { saveTopic } = await import('@/lib/storage');
      await saveTopic({ id, title: newTitle.trim(), results: null });
      loadTopics();
    }
  };

  // Group topics by date
  const groupedTopics = (() => {
    const groups: { label: string; items: SavedTopic[] }[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 7 * 86400000;

    const todayItems: SavedTopic[] = [];
    const yesterdayItems: SavedTopic[] = [];
    const thisWeekItems: SavedTopic[] = [];
    const olderMap = new Map<string, SavedTopic[]>();

    for (const t of topics) {
      const tDate = new Date(t.createdAt);
      const tDay = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate()).getTime();

      if (tDay >= today) {
        todayItems.push(t);
      } else if (tDay >= yesterday) {
        yesterdayItems.push(t);
      } else if (tDay >= weekAgo) {
        thisWeekItems.push(t);
      } else {
        const key = tDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
        if (!olderMap.has(key)) olderMap.set(key, []);
        olderMap.get(key)!.push(t);
      }
    }

    if (todayItems.length) groups.push({ label: 'Oggi', items: todayItems });
    if (yesterdayItems.length) groups.push({ label: 'Ieri', items: yesterdayItems });
    if (thisWeekItems.length) groups.push({ label: 'Questa settimana', items: thisWeekItems });
    for (const [key, items] of olderMap) {
      groups.push({ label: key, items });
    }
    return groups;
  })();

  return (
    <>
      <div
        className={`sidebar-overlay${open ? ' sidebar-overlay--visible' : ''}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <div className="sidebar__logo">
          <div className="logo-text">naked<span>stack</span></div>
        </div>

        <nav className="sidebar__nav">
          <button
            className="sidebar__new-topic"
            onClick={handleNewTopic}
          >
            <span className="sidebar__new-topic-icon"><Plus size={18} weight="duotone" /></span>
            Nuovo argomento
          </button>

          {groupedTopics.length > 0 && (
            <>
              {groupedTopics.map((group) => (
                <div key={group.label}>
                  <div className="sidebar__section-title">{group.label}</div>
                  {group.items.map((t) => (
                    <div key={t.id} className="sidebar__topic-row">
                      <button
                        className={`sidebar__link${pathname === '/studio' ? ' sidebar__link--active' : ''}`}
                        onClick={() => handleTopicClick(t.id)}
                      >
                        <span className="sidebar__topic-title">{t.title}</span>
                      </button>
                      <ContextMenu
                        items={[
                          { label: 'Apri', icon: <ArrowSquareOut size={14} weight="duotone" />, onClick: () => handleTopicClick(t.id) },
                          { label: 'Rinomina', icon: <PencilSimple size={14} weight="duotone" />, onClick: () => handleRename(t.id) },
                          { label: 'Elimina', icon: <Trash size={14} weight="duotone" />, onClick: () => handleDelete(t.id), danger: true },
                        ]}
                      >
                        <DotsThreeVertical size={16} weight="duotone" />
                      </ContextMenu>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </nav>

      </aside>
    </>
  );
}
