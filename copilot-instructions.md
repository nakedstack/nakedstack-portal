# nakedstack — Project Rules

## No Emoji
Non usare mai emoji nel codice, nei commenti, nei commit message, nei testi UI, nei nomi di file o in qualsiasi altro contenuto del progetto. Usa testo semplice.

## Naming
- Il nome dell'applicazione è **nakedstack** (tutto minuscolo).
- Package name: `nakedstack`

## Stile
- Tema ispirato a DigitalOcean.
- Font: Space Grotesk (testo), JetBrains Mono (codice).
- Usa SCSS con variabili definite in `_variables.scss`.

## Regole generali
- Non aggiungere package npm senza prima chiedere conferma.
- Mantieni il codice pulito e ben organizzato.
- Usa TypeScript strict quando possibile.

## Principi SOLID (obbligatori)
Ogni volta che scrivi, modifichi o inserisci codice devi applicare i principi SOLID:
- **Sostituisci** funzioni e metodi che richiedono riscrittura — non lasciarli parzialmente adattati.
- **Rimuovi** il codice inutilizzato (variabili, import, funzioni, tipi) che individui durante lo sviluppo.
- **Correggi** le funzioni non-SOLID che incontri durante il lavoro, rendendole conformi.
- Vedi `.github/instructions/solid.instructions.md` per le regole dettagliate.

## Commenti
- Scrivi tutti i commenti sempre in italiano.
- Se durante le modifiche individui commenti in inglese, traducili in italiano.

## Stile del codice
- Aggiorna e correggi lo stile del codice nei file che modifichi qualora non fosse presente o non fosse coerente con le convenzioni del progetto.
- Applica le convenzioni di stile TypeScript strict, SCSS con variabili da `_variables.scss`, e le regole ESLint del progetto.

## Convenzioni del progetto
- Se durante il lavoro individui pattern, strutture o decisioni architetturali nuove o modificate, aggiorna `copilot-instructions.md` di conseguenza.
- Se una convenzione non esiste ancora ma emerge dal lavoro corrente, creala documentandola in `copilot-instructions.md` o nel file `.instructions.md` appropriato.
- Non lasciare convenzioni implicite: se si consolida un pattern, rendilo esplicito nelle istruzioni.
