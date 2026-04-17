#!/bin/bash

# Carica nvm e usa Node 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use 22 2>/dev/null || echo "⚠️  nvm not found or Node 22 not installed. Please run: nvm install 22"

echo "🚀 Starting Firebase emulators..."
docker compose up -d

echo "⏳ Waiting for emulators to be ready..."
max_attempts=60
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if curl -s http://localhost:4000 > /dev/null 2>&1; then
    echo "✅ Emulators ready!"
    break
  fi
  sleep 1
  attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
  echo "⚠️  Emulators took too long to start, but continuing anyway..."
fi

# Mostra il link all'UI degli emulatori
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         ✅ Emulators ready and running!                  ║"
echo "║                                                           ║"
echo "║  🎮 Emulator UI:  http://localhost:4000                  ║"
echo "║  🌐 Frontend:     http://localhost:5173                  ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Apri il browser automaticamente
echo "🌐 Opening http://localhost:5173..."
if command -v xdg-open &> /dev/null; then
  xdg-open http://localhost:5173 &
elif command -v open &> /dev/null; then
  open http://localhost:5173 &
fi

echo "🎉 Starting Vite dev server..."
npm run dev
