'use client';

import { useExplore } from '@/lib/explore-context';
import type { Language } from '@/lib/ai/prompts';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'it', label: 'IT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useExplore();

  return (
    <div className="selector-pills" role="radiogroup" aria-label="Lingua">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          className={`selector-pill${language === code ? ' selector-pill--active' : ''}`}
          onClick={() => setLanguage(code)}
          role="radio"
          aria-checked={language === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
