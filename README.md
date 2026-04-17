nvm use 22
npm create vite@latest .
firebase init


Corretto:
File	Fix
Dockerfile	demo-hubcic → demo-cortex-cic
scripts/emulator-save.sh	demo-hubcic → demo-cortex-cic
.claude/settings.local.json	percorsi /hubCic/ → /cortexCic/ (×2)
.claude/CLAUDE.md	# hubCic → # cortexCic
Richiede azione manuale:

src/firebase-config.ts — tutti i valori (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId) e VAPID_PUBLIC_KEY puntano ancora al progetto hubcic. Devi sostituirli con le credenziali reali del progetto cortex-cic, che trovi su Firebase Console → Project settings → Your apps → Web app config.