# Task 05 — Identificare il progetto nel titolo delle notifiche

**Priorità:** media · **Area:** `functions/src/notifications/projectNotifications.ts`, `src/views/ProjectDash/Notifications/`

## Problema
Quando arriva una notifica non si capisce a quale progetto appartiene. Il titolo deve identificare il progetto, ad esempio con un prefisso: `[CTX] Deploy completato` oppure con il nome completo `[Cortex] Deploy completato`.

## Cosa fare
1. In `notifyProjectMembers` (o dove viene composta la notifica push/in-app), recuperare il nome del progetto e anteporlo al titolo: formato `[NomeProgetto] titolo`. Se il nome è lungo, valutare una sigla (prime 3–4 lettere maiuscole) — decidere UN formato e usarlo ovunque.
2. Applicarlo a tutte le sorgenti di notifica (log esterni via `receiveNotification`, notifiche task, ecc.) nel punto condiviso, non per singolo caso.
3. Nella lista notifiche in-app (`NotificationMessage.tsx`) mostrare il progetto anche visivamente (badge/chip) se la pagina aggrega più progetti.

## Accettazione
- Ogni notifica (push e in-app) mostra chiaramente il progetto di provenienza nel titolo.
