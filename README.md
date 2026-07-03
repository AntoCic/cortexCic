nvm use 22
npm create vite@latest .
firebase init


Corretto:
File	Fix
Dockerfile	demo-hubcic → demo-cortex-cic
scripts/emulator-save.sh	demo-hubcic → demo-cortex-cic
.claude/settings.local.json	percorsi /hubCic/ → /cortexCic/ (×2)
AGENTS.md	# hubCic → # cortexCic
Richiede azione manuale:

src/firebase-config.ts — tutti i valori (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId) e VAPID_PUBLIC_KEY puntano ancora al progetto hubcic. Devi sostituirli con le credenziali reali del progetto cortex-cic, che trovi su Firebase Console → Project settings → Your apps → Web app config.

{
  "mcpServers": {
    "cortex": {
      "command": "node",
      "args": ["[path]/mcp-server/dist/index.js"],
      "env": {
        "CORTEX_API_KEY": "<apiKey del progetto target, da Settings su cortexCic>",
        "CORTEX_FUNCTIONS_BASE_URL": "https://europe-west1-cortex-cic.cloudfunctions.net"
      }
    }
  }
}

Configura l'MCP server "cortex" per questo progetto.

1. Individua la cartella del cortex-mcp-server in (\dev\cortexCic\mcp-server).
2. Trova le chiavi necessarie in questo progetto e poi Registra il server MCP `claude mcp add cortex --scope project -e CORTEX_API_KEY=<INSERISCI_QUI> -e CORTEX_FUNCTIONS_BASE_URL=<INSERISCI_QUI> -- node <percorso-assoluto-a>/dist/index.js`
   (usa lo scope "project" così la chiave resta legata solo a questo progetto e non si propaga ad altri).
3. Verifica con `claude mcp list` che "cortex" risulti Connected.
