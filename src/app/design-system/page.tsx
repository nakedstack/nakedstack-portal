'use client';

import { Cpu, Database, ArrowRight, MagnifyingGlass, List, Plus, DotsThreeVertical, ArrowSquareOut, PencilSimple, Trash, X, FilePdf, BookOpen, PaperPlaneRight, GithubLogo } from '@phosphor-icons/react';

export default function DesignSystemPage() {
  return (
    <div className="ds-page">
      <h1>Design System — nakedstack</h1>
      <p>
        Questa pagina documenta tutti i design token, componenti e pattern
        utilizzati in nakedstack. Il tema è ispirato allo stile DigitalOcean.
      </p>

      {/* ==================== COLORS ==================== */}
      <h2>Colori</h2>

      <h3>Brand Palette</h3>
      <div>
        {[
          { name: 'Blue', var: '$do-blue', hex: '#0069FF' },
          { name: 'Blue Dark', var: '$do-blue-dark', hex: '#0052CC' },
          { name: 'Blue Light', var: '$do-blue-light', hex: '#E5F0FF' },
          { name: 'Blue 50', var: '$do-blue-50', hex: '#F0F6FF' },
          { name: 'Navy', var: '$do-navy', hex: '#031B4E' },
          { name: 'Green', var: '$do-green', hex: '#00B069' },
          { name: 'Green Light', var: '$do-green-light', hex: '#E5F9F0' },
          { name: 'Orange', var: '$do-orange', hex: '#FF6D00' },
          { name: 'Orange Light', var: '$do-orange-light', hex: '#FFF3E6' },
          { name: 'Red', var: '$do-red', hex: '#FF3B30' },
          { name: 'Red Light', var: '$do-red-light', hex: '#FFECEB' },
          { name: 'Purple', var: '$do-purple', hex: '#7B61FF' },
          { name: 'Purple Light', var: '$do-purple-light', hex: '#F2EFFF' },
          { name: 'Cyan', var: '$do-cyan', hex: '#00B5D8' },
          { name: 'Cyan Light', var: '$do-cyan-light', hex: '#E5F7FB' },
        ].map((c) => (
          <div key={c.var} className="ds-swatch">
            <div className="ds-swatch__color" style={{ background: c.hex }} />
            <div className="ds-swatch__label">
              <strong>{c.name}</strong>
              {c.hex}
            </div>
          </div>
        ))}
      </div>

      <h3>Sfondi</h3>
      <div className="ds-tokens">
        {[
          { name: '$bg-primary', value: '#FFFFFF' },
          { name: '$bg-secondary', value: '#F5F7FA' },
          { name: '$bg-card', value: '#FFFFFF' },
          { name: '$bg-code', value: '#1E1E2E' },
          { name: '$bg-code-inline', value: '#F0F3F7' },
        ].map((t) => (
          <div key={t.name} className="ds-token-row">
            <div className="ds-token-preview" style={{ background: t.value, border: t.value === '#FFFFFF' ? '1px solid #E2E6ED' : 'none' }}>
              {t.value === '#FFFFFF' ? 'Bg' : 'Cl'}
            </div>
            <span className="ds-token-name">{t.name}</span>
            <span className="ds-token-value">{t.value}</span>
          </div>
        ))}
      </div>

      <h3>Testo</h3>
      <div className="ds-tokens">
        {[
          { name: '$text-primary', value: '#031B4E', preview: '#031B4E' },
          { name: '$text-secondary', value: '#5B6B86', preview: '#5B6B86' },
          { name: '$text-muted', value: '#8895AD', preview: '#8895AD' },
          { name: '$text-link', value: '#0069FF', preview: '#0069FF' },
        ].map((t) => (
          <div key={t.name} className="ds-token-row">
            <div className="ds-token-preview" style={{ background: t.preview, color: '#fff' }}>
              Aa
            </div>
            <span className="ds-token-name">{t.name}</span>
            <span className="ds-token-value">{t.value}</span>
          </div>
        ))}
      </div>

      <h3>Bordi</h3>
      <div className="ds-tokens">
        {[
          { name: '$border-color', value: '#E2E6ED' },
          { name: '$border-light', value: '#F0F3F7' },
        ].map((t) => (
          <div key={t.name} className="ds-token-row">
            <div className="ds-token-preview" style={{ background: t.value, border: '1px solid #E2E6ED' }} />
            <span className="ds-token-name">{t.name}</span>
            <span className="ds-token-value">{t.value}</span>
          </div>
        ))}
      </div>

      {/* ==================== TYPOGRAPHY ==================== */}
      <h2>Tipografia</h2>

      <h3>Headings</h3>
      <div className="ds-type-specimen">
        <div className="specimen-label">h1 — 2.25rem / letter-spacing: -0.5px</div>
        <h1>Linux powers the modern web</h1>
      </div>
      <div className="ds-type-specimen">
        <div className="specimen-label">h2 — 1.75rem / letter-spacing: -0.3px</div>
        <h2>Architettura dei sistemi distribuiti</h2>
      </div>
      <div className="ds-type-specimen">
        <div className="specimen-label">h3 — 1.35rem</div>
        <h3>Consenso, replicazione, partizionamento</h3>
      </div>
      <div className="ds-type-specimen">
        <div className="specimen-label">h4 — 1.15rem</div>
        <h4>Raft, Paxos e leader election</h4>
      </div>

      <h3>Body & Inline</h3>
      <div className="ds-type-specimen">
        <div className="specimen-label">Paragraph</div>
        <p>
          Un database relazionale organizza i dati in tabelle collegate tra loro
          tramite chiavi esterne. <strong>Testo in grassetto</strong> e{' '}
          <a href="#">link ipertestuale</a> nel paragrafo.
        </p>
      </div>
      <div className="ds-type-specimen">
        <div className="specimen-label">Inline Code</div>
        <p>
          Usa <code>git commit -m &quot;fix: risolto il bug del parser&quot;</code> per versionare.
        </p>
      </div>

      <h3>Code Block</h3>
      <pre><code>{`def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`}</code></pre>

      <h3>Font Stack</h3>
      <div className="ds-tokens">
        <div className="ds-token-row">
          <span className="ds-token-name">$font-sans</span>
          <span className="ds-token-value" style={{ fontFamily: "'Space Grotesk', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'" }}>
            Space Grotesk, Inter, Segoe UI, system-ui
          </span>
        </div>
        <div className="ds-token-row">
          <span className="ds-token-name">$font-mono</span>
          <span className="ds-token-value" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'" }}>
            JetBrains Mono, Fira Code, Cascadia Code, Consolas
          </span>
        </div>
      </div>

      {/* ==================== SHADOWS ==================== */}
      <h2>Ombre</h2>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {[
          { name: '$shadow-sm', value: '0 1px 3px rgba(3,27,78,0.06)' },
          { name: '$shadow-md', value: '0 2px 8px rgba(3,27,78,0.08)' },
          { name: '$shadow-lg', value: '0 8px 30px rgba(3,27,78,0.12)' },
          { name: '$shadow-xl', value: '0 16px 48px rgba(3,27,78,0.16)' },
        ].map((s) => (
          <div
            key={s.name}
            style={{
              width: 140,
              height: 100,
              background: '#fff',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: s.value,
              fontSize: '0.72rem',
              fontFamily: "'JetBrains Mono', monospace",
              color: '#8895AD',
              textAlign: 'center',
              padding: '0.5rem',
            }}
          >
            {s.name}
          </div>
        ))}
      </div>

      {/* ==================== SPACING & LAYOUT ==================== */}
      <h2>Layout & Spacing</h2>
      <div className="ds-tokens">
        {[
          { name: '$sidebar-width', value: '280px' },
          { name: '$header-height', value: '64px' },
          { name: '$max-content-width', value: '1100px' },
          { name: '$border-radius', value: '4px' },
          { name: '$border-radius-lg', value: '6px' },
          { name: '$transition-speed', value: '0.2s' },
          { name: '$bp-mobile', value: '768px' },
          { name: '$bp-tablet', value: '1024px' },
        ].map((t) => (
          <div key={t.name} className="ds-token-row">
            <span className="ds-token-name">{t.name}</span>
            <span className="ds-token-value">{t.value}</span>
          </div>
        ))}
      </div>

      {/* ==================== COMPONENTS ==================== */}
      <h2>Componenti</h2>

      <h3>Cards</h3>
      <div className="ds-demo">
        <div className="card" style={{ maxWidth: 280 }}>
          <div className="card__icon"><Cpu size={24} weight="duotone" /></div>
          <div className="card__title">Linux Kernel</div>
          <div className="card__desc">
            Process scheduler, memoria virtuale, syscall: il nucleo del sistema operativo.
          </div>
          <a className="card__link" href="#">
            Vai al capitolo <ArrowRight size={14} weight="duotone" />
          </a>
        </div>
        <div className="card" style={{ maxWidth: 280 }}>
          <div className="card__icon"><Database size={24} weight="duotone" /></div>
          <div className="card__title">Database Internals</div>
          <div className="card__desc">
            B-Tree, WAL, MVCC: cosa succede dentro PostgreSQL quando esegui una query.
          </div>
          <a className="card__link" href="#">
            Vai al capitolo <ArrowRight size={14} weight="duotone" />
          </a>
        </div>
      </div>

      <h3>Info Boxes</h3>
      <div style={{ maxWidth: 600 }}>
        <div className="info-box">
          <div className="info-box__title">Nota</div>
          <p>I database ACID garantiscono Atomicità, Coerenza, Isolamento e Durabilità delle transazioni.</p>
        </div>
        <div className="info-box info-box--warning">
          <div className="info-box__title">Attenzione</div>
          <p>Non esporre mai porte di database direttamente su Internet senza TLS e autenticazione forte.</p>
        </div>
        <div className="info-box info-box--success">
          <div className="info-box__title">Best Practice</div>
          <p>Usa sempre il connection pooling per gestire in modo efficiente le connessioni al database.</p>
        </div>
      </div>

      <h3>Tags / Badges</h3>
      <div className="ds-demo">
        <span className="tag tag--blue">Base</span>
        <span className="tag tag--green">Intermedio</span>
        <span className="tag tag--orange">Avanzato</span>
        <span className="tag tag--purple">Linux</span>
        <span className="tag tag--cyan">Database</span>
      </div>

      <h3>Tabella</h3>
      <table className="k8s-table">
        <thead>
          <tr>
            <th>Argomento</th>
            <th>Descrizione</th>
            <th>Livello</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Kernel Linux</td>
            <td>Il cuore del sistema operativo: scheduler, memoria, driver</td>
            <td><span className="tag tag--blue">Base</span></td>
          </tr>
          <tr>
            <td>Reti TCP/IP</td>
            <td>Protocolli di comunicazione che fanno funzionare Internet</td>
            <td><span className="tag tag--green">Intermedio</span></td>
          </tr>
          <tr>
            <td>Crittografia TLS</td>
            <td>Handshake, certificati, cipher suite e forward secrecy</td>
            <td><span className="tag tag--orange">Avanzato</span></td>
          </tr>
        </tbody>
      </table>

      <h3>Timeline</h3>
      <div className="timeline">
        <div className="timeline__item">
          <div className="timeline__year">1991</div>
          <div className="timeline__title">Nasce Linux</div>
          <div className="timeline__desc">
            Linus Torvalds rilascia il kernel Linux come progetto open-source,ponendo le basi del software libero.
          </div>
        </div>
        <div className="timeline__item">
          <div className="timeline__year">2008</div>
          <div className="timeline__title">Rivoluzione DevOps</div>
          <div className="timeline__desc">
            Nasce il movimento DevOps: automazione, CI/CD, infrastructure as code trasformano il ciclo di vita del software.
          </div>
        </div>
        <div className="timeline__item">
          <div className="timeline__year">Oggi</div>
          <div className="timeline__title">AI & Cloud Native</div>
          <div className="timeline__desc">
            L&apos;intelligenza artificiale e le architetture cloud native sono lo standard per le applicazioni moderne.
          </div>
        </div>
      </div>

      <h3>Progress Bar</h3>
      <div style={{ maxWidth: 300 }}>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: '65%' }} />
        </div>
        <p style={{ fontSize: '0.8rem', color: '#8895AD' }}>65% completato</p>
      </div>

      <h3>Terminal Emulator</h3>
      <div className="term">
        <div className="term__header">
          <span className="term-dot" style={{ background: '#FF5F56' }} />
          <span className="term-dot" style={{ background: '#FFBD2E' }} />
          <span className="term-dot" style={{ background: '#27C93F' }} />
        </div>
        <pre style={{ background: 'none', border: 'none', margin: 0 }}><code>$ ps aux --sort=-%mem | head -5
USER       PID %CPU %MEM    VSZ   RSS TTY STAT START   TIME COMMAND
root      1234  2.5 12.3 1234567 456789 ?   Ssl  10:23   0:42 /usr/bin/postgres
nicolay   5678  0.3  3.1 987654 123456 ?   S    10:25   0:05 code-insiders</code></pre>
      </div>

      <h3>Chart Container</h3>
      <div className="chart-container">
        <p style={{ textAlign: 'center', color: '#8895AD' }}>
          Container per grafici e diagrammi SVG — sfondo bianco, bordo e ombra leggera.
        </p>
      </div>

      {/* ==================== ICONS ==================== */}
      <h2>Icone</h2>
      <p>
        nakedstack usa <strong>Phosphor Icons</strong> nella variante <strong>Duotone</strong>.
        La libreria è <code>@phosphor-icons/react</code>. Ogni icona accetta le prop{' '}
        <code>size</code>, <code>weight</code> (default: <code>duotone</code>),{' '}
        <code>color</code>, <code>mirrored</code>.
      </p>

      <h3>Icon Set Completo</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '0.75rem',
        marginTop: '1rem',
      }}>
        {[
          { icon: 'MagnifyingGlass', label: 'Cerca', size: 20, usage: 'SearchInput, CTA homepage' },
          { icon: 'List', label: 'Menu', size: 20, usage: 'HeaderBar (toggle sidebar)' },
          { icon: 'Plus', label: 'Nuovo', size: 18, usage: 'Sidebar (nuovo argomento)' },
          { icon: 'DotsThreeVertical', label: 'Altro', size: 18, usage: 'Sidebar (menu contestuale)' },
          { icon: 'ArrowSquareOut', label: 'Apri', size: 18, usage: 'ContextMenu (apri topic)' },
          { icon: 'PencilSimple', label: 'Rinomina', size: 18, usage: 'ContextMenu (rinomina)' },
          { icon: 'Trash', label: 'Elimina', size: 18, usage: 'ContextMenu (elimina)' },
          { icon: 'X', label: 'Chiudi', size: 18, usage: 'DetailCard, Reading Overlay' },
          { icon: 'FilePdf', label: 'PDF', size: 18, usage: 'ExportButtons (scarica PDF)' },
          { icon: 'BookOpen', label: 'Lettura', size: 18, usage: 'ExportButtons (modalità lettura)' },
          { icon: 'PaperPlaneRight', label: 'Invia', size: 18, usage: 'ChatPanel (invia messaggio)' },
          { icon: 'GithubLogo', label: 'GitHub', size: 16, usage: 'AppShell (footer link)' },
          { icon: 'Cpu', label: 'CPU / Kernel', size: 24, usage: 'Card (Linux Kernel example)' },
          { icon: 'Database', label: 'Database', size: 24, usage: 'Card (DB Internals example)' },
          { icon: 'ArrowRight', label: 'Freccia', size: 14, usage: 'Card link, navigazione' },
        ].map((item) => {
          const lookup: Record<string, React.ComponentType<{ size?: number }>> = {
            MagnifyingGlass, List, Plus, DotsThreeVertical, ArrowSquareOut,
            PencilSimple, Trash, X, FilePdf, BookOpen, PaperPlaneRight,
            GithubLogo, Cpu, Database, ArrowRight,
          };
          const IconComponent = lookup[item.icon];
          return (
            <div
              key={item.icon}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E6ED',
                borderRadius: '6px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#0069FF', display: 'flex' }}>
                {IconComponent && <IconComponent size={item.size} weight="duotone" />}
              </div>
              <code style={{ fontSize: '0.68rem', color: '#5B6B86', wordBreak: 'break-all' }}>
                {item.icon}
              </code>
              <span style={{ fontSize: '0.7rem', color: '#8895AD' }}>
                {item.usage}
              </span>
            </div>
          );
        })}
      </div>

      {/* ==================== BREAKPOINTS ==================== */}
      <h2>Breakpoints</h2>
      <div className="ds-tokens">
        <div className="ds-token-row">
          <span className="ds-token-name">$bp-mobile</span>
          <span className="ds-token-value">768px — Tablet e smartphone</span>
        </div>
        <div className="ds-token-row">
          <span className="ds-token-name">$bp-tablet</span>
          <span className="ds-token-value">1024px — Desktop small / Tablet landscape</span>
        </div>
      </div>
      <p>
        La sidebar diventa off-canvas sotto i 1024px. Il contenuto si adatta a
        singola colonna sotto i 768px.
      </p>
    </div>
  );
}
