# Task 04 — Nuovo tipo di log "success"

**Priorità:** media · **Area:** `functions/src/notifications/`, `src/views/ProjectDash/Notifications/`, `mcp-server/`

## Problema
I tipi di log/notifica oggi sono `'info' | 'error' | 'warning' | 'deploy'` (`PROJECT_NOTIFICATION_TYPES` in `functions/src/notifications/projectNotifications.ts:3`). Serve un tipo `success` per poter inviare log di esito positivo (hubLog success).

## Cosa fare
1. Aggiungere `'success'` a `PROJECT_NOTIFICATION_TYPES` — il resto (validazione in `receiveNotification.ts`, tipo TS) segue automaticamente perché derivato dalla const.
2. Lato UI (`NotificationsPage`, `NotificationFilters`, `NotificationMessage`): aggiungere il tipo `success` a filtri, colore (verde) e icona, seguendo il pattern degli altri tipi.
3. Verificare `mcpGetRecentLogs.ts` e le descrizioni dei tool MCP: menzionare il nuovo tipo.
4. Aggiornare README/doc dell'endpoint di invio log con il nuovo valore ammesso.

## Accettazione
- `POST` all'endpoint log con `type: "success"` viene accettato e la notifica appare nella UI con stile verde e filtro dedicato.
