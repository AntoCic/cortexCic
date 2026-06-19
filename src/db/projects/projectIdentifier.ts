const PROJECT_IDENTIFIER_MIN_LENGTH = 2;
const PROJECT_IDENTIFIER_MAX_LENGTH = 4;

export function normalizeProjectIdentifierInput(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, PROJECT_IDENTIFIER_MAX_LENGTH);
}

export function suggestProjectIdentifier(name: string): string {
  const normalized = normalizeProjectIdentifierInput(name);

  if (normalized.length >= 3) {
    return normalized.slice(0, 3);
  }

  if (normalized.length >= PROJECT_IDENTIFIER_MIN_LENGTH) {
    return normalized;
  }

  return 'PRJ';
}

export function isProjectIdentifierValid(value: string): boolean {
  return /^[A-Z]{2,4}$/.test(value);
}

export function getProjectIdentifierError(value: string): string | null {
  if (!value.trim()) {
    return 'Inserisci un identificativo progetto.';
  }

  if (!isProjectIdentifierValid(value)) {
    return 'L’identificativo deve avere da 2 a 4 lettere maiuscole.';
  }

  return null;
}

