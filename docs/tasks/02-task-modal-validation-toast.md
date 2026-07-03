# Task 02 — Validazione TaskModal con toast

**Priorità:** alta · **Area:** `src/views/ProjectDash/Tasks/cmp/TaskModal.tsx`

## Problema
Premendo "Salva" nella modal del task senza titolo non succede nulla: nessun errore, nessun feedback. L'utente pensa che il bottone sia rotto.

## Cosa fare
1. In `TaskModal.tsx`, al salvataggio validare i campi obbligatori (almeno il titolo).
2. Se la validazione fallisce: mostrare un toast di errore usando il componente esistente in `src/components/toast/` (es. "Il titolo è obbligatorio") e evidenziare il campo mancante (bordo rosso / messaggio sotto l'input).
3. Verificare che lo stesso pattern valga sia per creazione che per modifica del task.
4. Controllare se ci sono altri punti dell'app dove un submit fallisce silenziosamente per campi mancanti (es. creazione progetto, note) e applicare lo stesso fix.

## Accettazione
- Salvataggio senza titolo → toast di errore visibile + campo evidenziato, la modal resta aperta.
- Con titolo valido il salvataggio funziona come prima.
