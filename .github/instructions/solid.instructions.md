---
description: "Use when writing, modifying, or reviewing TypeScript/React code. Enforces SOLID principles, removes dead code, and replaces non-compliant functions."
applyTo: "**/*.{ts,tsx}"
---

# SOLID Code Rules

Apply these rules whenever you write or touch TypeScript/TSX code in this project.

## S — Single Responsibility Principle
- Each function, hook, component, and class must have exactly one reason to change.
- If a function does more than one thing, split it. Example: separate data-fetching from data-transformation.
- React components must not mix business logic with rendering — extract logic into custom hooks.

## O — Open/Closed Principle
- Extend behavior through composition, not by modifying existing stable functions.
- Prefer adding new variants via props, union types, or strategy objects rather than adding `if/else` branches to existing code.

## L — Liskov Substitution Principle
- Subtypes and interface implementations must be fully substitutable for their base type.
- Never narrow a contract in an implementation (e.g., throwing where the interface promises a value).

## I — Interface Segregation Principle
- Keep TypeScript interfaces and prop types narrow. Do not pass large objects when only a few fields are needed.
- Split wide interfaces into smaller, focused ones. Prefer passing specific props over entire context objects.

## D — Dependency Inversion Principle
- High-level modules must not depend on low-level implementations — depend on abstractions (interfaces/types).
- Inject dependencies (API clients, DB access, utilities) rather than importing them directly inside business logic.
- In React, pass callbacks and data via props or context rather than calling concrete modules directly inside components.

---

## Code Quality — always enforce alongside SOLID

### Replace, don't patch
- When a function needs to change to become SOLID-compliant, **rewrite it completely** in place.
- Do not leave partial adaptations or wrapper shims around old code.

### Remove unused code
- Delete unused variables, imports, functions, types, and constants when you encounter them.
- Do not leave `// TODO: remove` comments — remove the code now.

### Dead imports
- Remove any `import` that is no longer referenced after your changes.
- Use explicit named imports; never import entire modules when only one export is used.

### No side-effect coupling
- Functions must not modify external state as a side effect unless that is their sole documented purpose.
- Avoid mutating function arguments; return new values instead.

---

---

## Commenti — sempre in italiano
- Scrivi tutti i nuovi commenti in italiano.
- Se durante le modifiche trovi commenti in inglese nel codice che stai toccando, traducili in italiano.
- I commenti JSDoc (`/** */`) vanno anch'essi scritti in italiano.

## Stile del codice — correggi mentre lavori
- Se il file che stai modificando ha stile incoerente (indentazione, spaziatura, virgolette, ordine degli import), correggilo.
- Applica le regole ESLint del progetto (`eslint.config.mjs`).
- Usa sempre le variabili SCSS da `_variables.scss` nei file `.scss` — non inserire valori hardcoded.
- Mantieni gli import ordinati: librerie esterne prima, poi interni, poi tipi.

## Convenzioni del progetto — aggiorna o crea
- Se durante il lavoro emerge un nuovo pattern consolidato (naming, struttura file, approccio architetturale), aggiornalo in `copilot-instructions.md`.
- Se la convenzione non esiste ancora, creala: non lasciare pattern impliciti.
- Se una convenzione esistente e diventata obsoleta o errata rispetto al codice attuale, correggila.
- Esempi di quando aggiornare: nuovo tipo di hook introdotto, nuova struttura cartelle stabilita, nuova regola di naming per componenti, nuova strategia di gestione stato.

---

## Practical Checklist (apply before finishing any edit)

- [ ] Ogni funzione/componente ha una singola responsabilita
- [ ] Nessuna variabile, import o codice morto lasciato indietro
- [ ] Le dipendenze sono iniettate, non hardcoded dentro la funzione
- [ ] Interfacce e prop types sono narrow e focalizzati
- [ ] Le funzioni che richiedevano ristrutturazione sono state riscritte (non rattoppate)
- [ ] Nessun tipo `any` introdotto — usa tipi specifici o generics
- [ ] Tutti i commenti sono in italiano
- [ ] Lo stile del codice e coerente con le convenzioni del progetto
