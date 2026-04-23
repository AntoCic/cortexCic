export const NoteType = {
  general: 'general',
  code: 'code',
  link: 'link',
  idea: 'idea',
  reminder: 'reminder',
} as const;

export type NoteTypeValue = (typeof NoteType)[keyof typeof NoteType];

export const NoteTypeLabel: Record<NoteTypeValue, string> = {
  general: 'Generale',
  code: 'Codice',
  link: 'Link',
  idea: 'Idea',
  reminder: 'Promemoria',
};

export const NoteTypeColor: Record<NoteTypeValue, string> = {
  general: '#6c757d',
  code: '#0d6efd',
  link: '#0dcaf0',
  idea: '#ffc107',
  reminder: '#dc3545',
};

export function getValue(key: string): NoteTypeValue | undefined {
  return NoteType[key as keyof typeof NoteType];
}

export function isNoteType(val: unknown): val is NoteTypeValue {
  return typeof val === 'string' && Object.values(NoteType).includes(val as NoteTypeValue);
}
