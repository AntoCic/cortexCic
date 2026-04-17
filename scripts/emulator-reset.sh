#!/bin/bash

echo "🗑️  Resetting emulator state..."
echo ""

# Ferma il container se è in esecuzione
if docker compose ps firebase 2>/dev/null | grep -q "Up"; then
  echo "⏹️  Stopping container..."
  docker compose down
  sleep 2
fi

# Cancella tutto lo stato salvato
echo "🗑️  Deleting emulator-data..."
if [ -d "emulator-data" ]; then
  rm -rf emulator-data/
  echo "✅ emulator-data/ deleted"
else
  echo "ℹ️  emulator-data/ not found"
fi

# Cancella i debug logs
if [ -f "firestore-debug.log" ]; then
  rm -f firestore-debug.log
  echo "✅ firestore-debug.log deleted"
fi

echo ""
echo "✅ Emulator state completely reset"
echo "💡 Next 'npm run start' will begin with a fresh database"
