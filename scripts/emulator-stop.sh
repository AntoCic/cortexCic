#!/bin/bash

echo "🛑 Stopping Firebase emulators..."
docker compose down

echo "✅ Emulators stopped"
echo "💡 To save state manually, use: npm run emulator:save"
