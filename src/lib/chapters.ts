// Dati dei capitoli
export interface Chapter {
  slug: string;
  title: string;
  number: number;
  difficulty: 'base' | 'intermedio' | 'avanzato';
}

export const chapters: Chapter[] = [];
