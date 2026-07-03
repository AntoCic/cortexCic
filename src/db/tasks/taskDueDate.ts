import { Timestamp } from 'firebase/firestore';

/** Timestamp -> 'YYYY-MM-DD' for the native date input; '' when unset. */
export function timestampToDateInputValue(ts?: Timestamp): string {
  if (!ts) return '';
  const d = ts.toDate();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** 'YYYY-MM-DD' (local midnight) -> Timestamp. */
export function dateInputToTimestamp(value: string): Timestamp {
  return Timestamp.fromDate(new Date(`${value}T00:00:00`));
}
