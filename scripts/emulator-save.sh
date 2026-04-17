#!/bin/bash

echo "💾 Saving emulator state..."

# Controlla se il container è in esecuzione
if ! docker compose ps firebase | grep -q "Up"; then
  echo "⚠️  Firebase container is not running."
  echo "ℹ️  The state is automatically saved when the container stops."
  echo "✅ State should be in emulator-data/"

  # Controlla se la cartella esiste e ha contenuti
  if [ -d "emulator-data" ] && [ "$(ls -A emulator-data)" ]; then
    echo "✅ Previous state found in emulator-data/"
  else
    echo "⚠️  No saved state found. Run 'npm run start' and the emulators will create new data."
  fi
  exit 0
fi

# Se il container è in esecuzione, forza l'export con il corretto project
echo "Exporting data from running container..."
docker compose exec firebase firebase emulators:export ./emulator-data --project demo-cortex-cic --force

if [ $? -eq 0 ]; then
  echo "✅ State saved to emulator-data/"
else
  echo "⚠️  Export failed, but data may still be saved on container shutdown"
fi
