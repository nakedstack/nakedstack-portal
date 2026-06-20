'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import ShaderBackground from '@/components/ShaderBackground';
import { MagnifyingGlass } from '@phosphor-icons/react';

export default function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('animate-in'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.card, .pillar-card, .section').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="hero">
        <ShaderBackground />
        <h1>nakedstack</h1>
        <p className="hero__subtitle">
          Rimuoviamo ogni strato esterno fino ad arrivare al cuore delle cose.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600, lineHeight: 1.7 }}>
          Tecnologia, architettura, infrastruttura: dietro ogni argomento c&apos;e un nucleo
          essenziale. <strong>nakedstack</strong> scrosta via complessita inutile, astrazioni opache
          e strati superflui per mostrarti cio che conta davvero.
        </p>
      </section>

      <section className="section">
        <h2 className="section__title">Il Metodo</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {[
            { title: 'Scrostare', desc: 'Via il rumore: niente marketing, niente mode passeggere. Solo fatti e meccanismi reali.' },
            { title: 'Sezionare', desc: 'Ogni argomento viene smontato pezzo per pezzo, dal layer piu esterno fino al nucleo.' },
            { title: 'Capire', desc: 'Una volta rimosso il superfluo, cio che resta e chiaro, solido e non si dimentica piu.' },
          ].map((p, i) => (
            <div key={i} className={`pillar-card animate-in${i > 0 ? ` animate-delay-${Math.min(i, 4)}` : ''}`}>
              <div className="pillar-card__number">0{i + 1}</div>
              <h3 className="pillar-card__title">{p.title}</h3>
              <p className="pillar-card__desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section home-cta-section">
        <div className="home-cta">
          <span className="home-cta__badge">AI-Powered</span>
          <h2 className="home-cta__title">
            Pronto a esplorare <em>qualsiasi</em> argomento?
          </h2>
          <p className="home-cta__desc">
            Fai una domanda. L&apos;AI ti risponde con spiegazioni chiare, diagrammi, mappe concettuali
            e un percorso di approfondimento su misura. Nessuna complessità inutile: solo il nucleo di ciò che ti serve.
          </p>
          <Link href="/studio" className="home-cta__btn">
            <MagnifyingGlass size={20} weight="duotone" />
            Vai alla Ricerca
          </Link>
          <div className="home-cta__examples">
            <span>Oppure parti da qui:</span>
            <button onClick={() => window.location.href = '/studio'}>Cos&apos;è un sistema distribuito?</button>
            <button onClick={() => window.location.href = '/studio'}>Come funziona la crittografia TLS?</button>
            <button onClick={() => window.location.href = '/studio'}>Spiegami il kernel Linux</button>
          </div>
        </div>
      </section>
    </>
  );
}
