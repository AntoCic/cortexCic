# Task 07 — Assegnatario del task (opzionale)

**Priorità:** media · **Area:** `src/views/ProjectDash/Tasks/`, `src/db/`

## Obiettivo
Campo `assignee` sul task, scelto tra i membri del progetto. **Opzionale**: default "Nessuno", i task esistenti (senza campo) restano validi e visibili come non assegnati.

## Cosa fare
1. **Dati:** campo opzionale `assigneeUid?: string` sul documento task (le regole tasks già permettono write ai membri, nessuna modifica alle rules).
2. **TaskModal:** select "Assegnato a" popolata dai `members` del progetto (nome/email), con opzione "Nessuno" che rimuove il campo. Nessuna validazione: può restare vuoto.
3. **TaskCard:** se assegnato, mostrare un badge/avatar con le iniziali dell'assegnatario.
4. **Filtro:** nella board Kanban aggiungere un filtro "Assegnatario" (tutti / i miei / per membro). Gestire i task legacy senza campo come "non assegnati".
5. Opzionale ma consigliato: notifica al membro quando gli viene assegnato un task, riusando `notifyProjectMembers`.

## Accettazione
- Posso assegnare/rimuovere l'assegnatario da un task; la card lo mostra; il filtro "i miei task" funziona.
- I task esistenti senza `assigneeUid` non rompono nulla e appaiono come non assegnati.
