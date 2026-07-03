# Task 06 — Commenti sui task (opzionale)

**Priorità:** media · **Area:** `src/views/ProjectDash/Tasks/cmp/TaskModal.tsx`, `firestore.rules`, `src/db/`

## Obiettivo
Thread di commenti dentro il task, per collaborare sui progetti condivisi. Feature **opzionale**: un task senza commenti resta identico a oggi, nessun campo obbligatorio, nessun impatto sul flusso attuale di creazione/salvataggio.

## Cosa fare
1. **Dati:** subcollection `projects/{projectId}/tasks/{taskId}/comments/{commentId}` con `{ text, authorUid, authorName, createdAt }`. Niente edit/reply annidati per ora.
2. **Regole:** in `firestore.rules` aggiungere il match per `comments` sotto `tasks`: read/create per `isProjectMember`, delete solo se `authorUid == request.auth.uid` (o project admin).
3. **UI:** nella `TaskModal` aggiungere una sezione "Commenti" in fondo (visibile solo per task già salvati): lista commenti (autore + data) + input con invio. Seguire lo stile CSS module esistente.
4. I commenti si caricano solo all'apertura della modal (no listener globali).
5. Opzionale ma consigliato: notifica agli altri membri quando arriva un commento, riusando `notifyProjectMembers`.

## Accettazione
- Due account membri dello stesso progetto vedono e scrivono commenti sullo stesso task.
- Un non-membro non può leggere/scrivere commenti (regole).
- Task senza commenti: nessun cambiamento visivo oltre alla sezione vuota.

> Dipende dal Task 03 (accesso membri condivisi) per essere utile davvero.
