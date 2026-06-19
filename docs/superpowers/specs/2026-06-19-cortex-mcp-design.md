# cortexCic MCP Server — Design

## Goal

Let an AI coding assistant (Claude Code, Codex, ecc.) usato su un progetto esterno leggere i log/errori inviati a cortexCic e gestire le task di quel progetto, senza passare dalla UI web. Caso d'uso tipico: "ho un errore in produzione" → l'AI legge i log recenti via MCP, capisce la causa, eventualmente crea/aggiorna una task.

## Scope (v1)

- Uso **personale**, MCP **locale** (stdio), collegato al **Firestore di produzione**.
- Scoping per progetto tramite la `apiKey` già esistente su ogni progetto cortexCic (stessa chiave usata da `notify.ts`).
- Niente service account / Firebase Admin SDK lato client locale: il client MCP non parla mai direttamente con Firestore, passa sempre per nuove Cloud Functions HTTP.
- Versione remota/multi-tenant esplicitamente fuori scope per v1 (l'architettura a Cloud Functions la rende possibile in futuro senza riscrivere la logica).

## Architettura

Due componenti nuovi:

1. **Cloud Functions** (`functions/src/`) — 4 nuovi endpoint HTTP `onRequest`, stesso pattern di `functions/src/notifications/receiveNotification.ts`: leggono `api-key` dall'header, risolvono il `projectId` cercando il progetto con quella `apiKey` (`db.collection('projects').where('apiKey', '==', apiKey).limit(1)`), poi eseguono l'operazione scoped a quel progetto.
2. **MCP server locale** (`mcp-server/`, nuova cartella a livello di repo) — progetto Node/TS che usa `@modelcontextprotocol/sdk` con trasporto stdio. Espone 4 tool; ogni tool fa una `fetch` HTTP verso la Cloud Function corrispondente, passando `CORTEX_API_KEY` (env var) come header `api-key`.

Il MCP server vive nello stesso repo delle Cloud Function per tenere sincronizzati contratto API e tool quando uno dei due cambia.

## Tool MCP (v1)

| Tool | Input | Comportamento |
|---|---|---|
| `get_recent_logs` | `type?: 'info'\|'error'\|'warning'\|'deploy'`, `limit?: number` (default 20) | Ritorna gli ultimi N log/notifiche del progetto, filtrabili per tipo |
| `create_task` | `title: string`, `description?: string`, `status?: 'todo'\|'inprogress'\|'done'\|'block'` (default `todo`) | Crea una task nella kanban del progetto |
| `list_tasks` | `status?: 'todo'\|'inprogress'\|'done'\|'block'` | Elenca le task del progetto, filtrabili per colonna |
| `update_task_status` | `taskId: string`, `status: 'todo'\|'inprogress'\|'done'\|'block'` | Sposta una task tra colonne |

Tutti i 4 endpoint condividono la stessa logica di resolve-projectId-da-apiKey (estratta in un helper riusabile, analogo a quanto già fa `receiveNotification.ts`).

## Data flow

AI client → invoca tool MCP → MCP server fa `POST` HTTP alla Cloud Function corrispondente con header `api-key: <CORTEX_API_KEY>` e body coi parametri → la Function valida la key, risolve `projectId`, esegue la query/scrittura Firestore scoped al progetto → risponde JSON → il MCP server formatta il risultato in testo/struttura leggibile e lo ritorna all'AI.

## Error handling

- `apiKey` mancante o non valida → Function risponde `401` → il tool MCP la traduce in un errore chiaro ("API key invalida, controlla CORTEX_API_KEY") invece di un crash silenzioso.
- Parametri non validi (es. `status` fuori dall'enum) → `400` con messaggio specifico, propagato all'AI per permetterle di correggere la chiamata.
- Errori Firestore/interni imprevisti → `500` generico, loggato server-side (Cloud Functions logs), messaggio neutro al client.

## Configurazione locale

- `CORTEX_API_KEY` passata come env var nel file di config MCP del client (es. `.mcp.json` per Claude Code), puntando alla apiKey del progetto target.
- Il MCP server viene buildato (`tsc`) e lanciato come `node mcp-server/build/index.js` dal client AI.

## Testing

- Ogni nuova Cloud Function testata manualmente via `curl` con la apiKey di un progetto reale, prima di toccare l'MCP (happy path + apiKey invalida + parametri invalidi).
- MCP server testato collegandolo a Claude Code in locale (`.mcp.json`) e invocando i 4 tool a mano, verificando sia le risposte corrette che i percorsi di errore.

## Fuori scope (v1)

- Versione remota/multi-tenant (server HTTP sempre online, autenticazione multi-utente).
- Service account / accesso diretto a Firestore dal client locale.
- Tool di scrittura sui log (il flusso log resta solo lettura dal lato MCP; la scrittura log avviene già via `notify.ts` dai progetti esterni).
