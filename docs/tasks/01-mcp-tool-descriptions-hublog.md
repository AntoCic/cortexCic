# Task 01 — Migliorare descrizioni tool MCP + alias "hubLog"

**Priorità:** media · **Area:** `mcp-server/`, `functions/src/mcp/`

## Problema
Quando si chiede a Claude di usare l'MCP di Cortex, risponde che "non sa come creare o modificare file". Le descrizioni dei tool non spiegano chiaramente cosa il server sa fare (task e log, NON file) e Claude si confonde sullo scopo del server.

## Cosa fare
1. In `mcp-server/src/tools.ts` riscrivere le descrizioni dei tool in modo esplicito e orientato all'azione, es.:
   - `create_task`: "Crea un task nel progetto Cortex (titolo, descrizione, categoria, urgenza). Usalo quando l'utente vuole aggiungere un task/todo al progetto."
   - `update_task_status`, `list_tasks`, `get_recent_logs`: stesso trattamento.
2. Aggiungere `instructions` a livello di server MCP (campo `instructions` di `McpServer`/`Server`) che spieghi: "Questo server gestisce task e log del progetto Cortex. Non gestisce file del filesystem."
3. **Alias hubLog:** i log di progetto possono essere chiamati anche "hubLog". Inserire il termine nelle descrizioni dei tool relativi ai log (`get_recent_logs` e l'endpoint di invio log), es. "Recupera i log di progetto (detti anche hubLog)". Così quando l'utente dice "hubLog" Claude capisce che si tratta dei log Cortex.
4. Aggiornare `mcp-server/README.md` con la terminologia hubLog.

## Accettazione
- Chiedendo a Claude "manda un hubLog" o "crea un task su Cortex" sceglie il tool giusto senza dire che non sa gestire file.
