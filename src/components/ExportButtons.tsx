'use client';

import { useState, useCallback } from 'react';
import { useExplore } from '@/lib/explore-context';
import { jsPDF } from 'jspdf';
import { FilePdf, BookOpen, X } from '@phosphor-icons/react';

export default function ExportButtons() {
  const { results, breadcrumbs } = useExplore();
  const [readingMode, setReadingMode] = useState(false);

  const handlePdf = useCallback(() => {
    if (!results) return;

    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);

    const title = breadcrumbs.length > 0
      ? `nakedstack: ${breadcrumbs[breadcrumbs.length - 1].term}`
      : 'nakedstack';

    // Word wrap title
    const titleLines = doc.splitTextToSize(title, maxWidth);
    titleLines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 10;
    });

    y += 6;

    // Breadcrumb trail
    if (breadcrumbs.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const trail = breadcrumbs.map(b => b.term).join(' > ');
      doc.text(trail, margin, y);
      y += 8;
    }

    y += 4;

    // Content
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.setFont('Helvetica', 'normal');

    const paragraphs = results.text.split('\n\n');
    paragraphs.forEach(para => {
      const lines = doc.splitTextToSize(para.trim(), maxWidth);
      lines.forEach((line: string) => {
        if (y > 270) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 6;
      });
      y += 3;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generato da nakedstack', margin, 285);

    doc.save('nakedstack.pdf');
  }, [results, breadcrumbs]);

  if (!results) return null;

  return (
    <>
      <div className="export-bar">
        <button className="export-btn" onClick={handlePdf} title="Scarica come PDF">
          <FilePdf size={16} weight="duotone" /> Scarica PDF
        </button>
        <button
          className="export-btn"
          onClick={() => setReadingMode(true)}
          title="Modalita lettura senza distrazioni"
        >
          <BookOpen size={16} weight="duotone" /> Modalita lettura
        </button>
      </div>

      {readingMode && (
        <div className="reading-overlay" onClick={() => setReadingMode(false)}>
          <button
            className="reading-overlay__close"
            onClick={(e) => { e.stopPropagation(); setReadingMode(false); }}
          >
            <X size={20} weight="duotone" />
          </button>
          <div className="reading-overlay__content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#FFFFFF', fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>
              {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].term : 'nakedstack'}
            </h2>
            {results.text.split('\n\n').map((p, i) => (
              <p key={i} style={{ marginBottom: '0.75rem' }}>{p}</p>
            ))}
            <p style={{ color: '#5B6B86', fontSize: '0.85rem', marginTop: '2rem' }}>
              Generato da nakedstack
            </p>
          </div>
        </div>
      )}
    </>
  );
}
