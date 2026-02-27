#!/usr/bin/env bash
set -e

# ---- .env prüfen ------------------------------------------------------
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo ""
    echo "⚠️  .env wurde aus .env.example erstellt."
    echo "   Bitte VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY eintragen:"
    echo "   → .env"
    echo ""
  else
    echo "❌ Weder .env noch .env.example gefunden."
    exit 1
  fi
fi

# Warnen wenn Supabase-Werte noch Platzhalter sind
if grep -q "your_supabase" .env 2>/dev/null; then
  echo "⚠️  Supabase-Credentials in .env sind noch Platzhalter."
  echo "   Auth und Datenbank funktionieren erst nach Eintragen der echten Werte."
  echo ""
fi

# ---- node_modules prüfen ----------------------------------------------
if [ ! -d "node_modules" ]; then
  echo "📦 node_modules fehlt – npm install wird ausgeführt…"
  npm install
fi

# ---- Dev-Server starten -----------------------------------------------
echo "🚀 AnsitzPlaner Dev-Server startet auf http://localhost:5173"
echo "   Zum Beenden: Strg+C"
echo ""
npm run dev
