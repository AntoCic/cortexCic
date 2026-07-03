# Task 03 — I membri di un progetto condiviso non riescono a interagire

**Priorità:** alta (bug) · **Area:** client `src/views/ProjectDash/`, `src/db/`, eventualmente `firestore.rules`

## Problema
Se un progetto viene condiviso con un utente, quell'utente NON riesce a: aggiungere task, modificare task, caricare file, salvare task. Deve invece poter interagire pienamente col progetto.

## Indizi già raccolti
- `firestore.rules` (righe 71–74): `projects/{projectId}/tasks` permette già `read, write` a qualunque `isProjectMember` → le regole tasks NON sono il blocco.
- `storage.rules` (righe 49–53): upload/lettura file permessi ai membri → nemmeno lo storage è il blocco, a patto che `members` contenga l'uid del membro.
- La rule `list` sui progetti usa `memberUids` mentre `get` usa `members`: verificare che alla condivisione vengano scritti ENTRAMBI i campi (`members[uid]` e `memberUids` array). Se manca uno dei due, alcune query/regole falliscono.

## Cosa fare
1. Riprodurre: con un secondo account, aprire un progetto condiviso e provare a creare/modificare un task e caricare un file. Annotare l'errore esatto (console/network).
2. Verificare il flusso di condivisione: il documento progetto dopo la condivisione contiene sia `members.{uid}` sia `memberUids`?
3. Controllare il client: query o guard UI che filtrano per `ownerId` o ruolo `admin` invece che per membership (cercare `ownerId`, `role === 'admin'` in `src/`). Il fix va fatto nel punto condiviso (helper di permessi), non spargendo controlli.
4. Aggiornare `firestore.rules` solo se la riproduzione dimostra un permission-denied lato regole.

## Accettazione
- Un utente con cui è condiviso il progetto può: creare task, modificarli, cambiare stato, allegare file, salvare — senza errori.
- L'owner/admin mantiene i permessi extra (settings, delete).
