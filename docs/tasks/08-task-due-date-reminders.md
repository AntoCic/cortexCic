# Task 08 — Scadenze e promemoria (opzionale)

**Priorità:** media · **Area:** `src/views/ProjectDash/Tasks/`, `functions/src/`

## Obiettivo
Campo `dueDate` opzionale sul task + promemoria automatico via il sistema notifiche esistente quando la scadenza si avvicina. **Opzionale**: task senza scadenza = comportamento identico a oggi.

## Cosa fare
1. **Dati:** campo opzionale `dueDate?: Timestamp` sul task.
2. **TaskModal:** input data nativo (`<input type="date">`, niente librerie datepicker) con possibilità di svuotarlo. Nessuna validazione obbligatoria.
3. **TaskCard:** mostrare la scadenza; evidenziare in giallo se entro 24–48h, in rosso se scaduta e il task non è completato.
4. **Promemoria backend:** scheduled function (`onSchedule`, 1 volta al giorno) in `functions/src/tasks/` che trova i task con `dueDate` entro 24h non completati e senza promemoria già inviato, e chiama `notifyProjectMembers` ("[Progetto] Il task X scade domani" — coerente col Task 05). Marcare `reminderSentAt` sul task per non notificare due volte.
5. Se esiste il Task 07 (assignee), notificare solo l'assegnatario quando presente, altrimenti tutti i membri.

## Accettazione
- Task con scadenza: visibile sulla card con i colori giusti; promemoria inviato una sola volta entro 24h dalla scadenza.
- Task senza scadenza: nessun cambiamento, nessuna notifica.
