'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchDeletedPages, apiRestorePage, apiPermanentDeletePage } from '@/lib/api/pages-api';
import type { Page } from '@/lib/types/pages';
import { ArrowCounterClockwise, TrashSimple, FileText } from '@phosphor-icons/react';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function TrashPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchDeletedPages();
    setPages(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRestore(id: string) {
    setBusy(id);
    const page = await apiRestorePage(id);
    await load();
    setBusy(null);
    router.push(`/pages/${page.id}`);
  }

  async function handlePermanentDelete() {
    if (!confirmDeleteId) return;
    setBusy(confirmDeleteId);
    setConfirmDeleteId(null);
    await apiPermanentDeletePage(confirmDeleteId);
    await load();
    setBusy(null);
  }

  return (
    <div className="trash-page">
      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Eliminare definitivamente?"
        message="Questa azione è irreversibile. La pagina e tutti i suoi blocchi verranno rimossi dal database."
        confirmLabel="Elimina definitivamente"
        cancelLabel="Annulla"
        variant="danger"
        onConfirm={handlePermanentDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <div className="trash-page__header">
        <h1 className="trash-page__title">Cestino</h1>
        <p className="trash-page__subtitle">Le pagine eliminate vengono conservate qui. Ripristinale o eliminale definitivamente.</p>
      </div>

      {loading ? (
        <div className="trash-page__empty">Caricamento…</div>
      ) : pages.length === 0 ? (
        <div className="trash-page__empty">Il cestino è vuoto.</div>
      ) : (
        <ul className="trash-page__list">
          {pages.map(page => (
            <li key={page.id} className="trash-page__item">
              <span className="trash-page__item-icon">{page.icon ?? <FileText size={16} />}</span>
              <div className="trash-page__item-info">
                <span className="trash-page__item-title">{page.title || 'Senza titolo'}</span>
                <span className="trash-page__item-date">
                  Eliminata il {new Date(page.deletedAt!).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="trash-page__item-actions">
                <button
                  className="trash-page__btn trash-page__btn--restore"
                  onClick={() => handleRestore(page.id)}
                  disabled={busy === page.id}
                  title="Ripristina"
                >
                  <ArrowCounterClockwise size={14} /> Ripristina
                </button>
                <button
                  className="trash-page__btn trash-page__btn--delete"
                  onClick={() => setConfirmDeleteId(page.id)}
                  disabled={busy === page.id}
                  title="Elimina definitivamente"
                >
                  <TrashSimple size={14} /> Elimina
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
