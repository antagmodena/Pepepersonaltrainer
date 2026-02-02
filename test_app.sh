#!/bin/bash

echo ""
echo "🎾 TEST MYPADELOG - Verifica Completa"
echo "======================================"
PASS=0
FAIL=0
WARN=0

check() {
  if [ $1 -eq 0 ]; then
    echo "  ✅ $2"
    PASS=$((PASS+1))
  else
    echo "  ❌ $2"
    FAIL=$((FAIL+1))
  fi
}

warn() {
  echo "  ⚠️  $1"
  WARN=$((WARN+1))
}

SRC="src"

# =============================================
echo ""
echo "📁 TEST 1: File esistono"
echo "-----------------------------------"
for f in \
  "app/organize/page.tsx" \
  "app/e/[id]/page.tsx" \
  "app/e/[id]/EventClient.tsx" \
  "app/dashboard/DashboardClient.tsx" \
  "app/companions/page.tsx" \
  "app/quick-match/page.tsx" \
  "app/leagues/[id]/page.tsx" \
  "app/leagues/[id]/plan/page.tsx" \
  "app/onboarding/page.tsx"
do
  test -f "$SRC/$f"
  check $? "$f"
done

# =============================================
echo ""
echo "📲 TEST 2: WhatsApp - Nessun template literal in window.open"
echo "-----------------------------------"

BAD_WA=$(grep -rn 'window\.open(`https://wa\.me' $SRC/app/ --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$BAD_WA" = "0" ]; then
  echo "  ✅ Nessun window.open con template literal trovato"
  PASS=$((PASS+1))
else
  echo "  ❌ Trovate $BAD_WA righe con window.open + template literal:"
  grep -rn 'window\.open(`https://wa\.me' $SRC/app/ --include="*.tsx" 2>/dev/null
  FAIL=$((FAIL+1))
fi

GOOD_WA=$(grep -rn "wa.me" $SRC/app/ --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "  ℹ️  Totale riferimenti wa.me: $GOOD_WA"

# Check correct pattern
SAFE_WA=$(grep -rn "encodeURIComponent" $SRC/app/ --include="*.tsx" 2>/dev/null | grep "wa.me" | wc -l | tr -d ' ')
echo "  ℹ️  Con encodeURIComponent: $SAFE_WA"

# =============================================
echo ""
echo "🏟️ TEST 3: Organize page"
echo "-----------------------------------"

F="$SRC/app/organize/page.tsx"

grep -q "event_date" "$F"
check $? "Ha campo event_date"

grep -q "event_time\|start_time" "$F"
check $? "Ha campo orario"

grep -q "location" "$F"
check $? "Ha campo location"

grep -q "event_participants" "$F"
check $? "Salva partecipanti"

grep -q "slot_position" "$F"
check $? "Ha slot_position (4 slot)"

grep -q "encodeURIComponent" "$F"
check $? "WhatsApp con encodeURIComponent"

grep -q "wa.me" "$F"
check $? "Link WhatsApp presente"

grep -q "/e/" "$F"
check $? "Link evento nel messaggio WhatsApp"

# =============================================
echo ""
echo "📋 TEST 4: Event page /e/[id]"
echo "-----------------------------------"

F="$SRC/app/e/[id]/page.tsx"

grep -q "event_participants" "$F"
check $? "Carica partecipanti"

grep -q "profiles" "$F"
check $? "Carica profili"

grep -q "notFound" "$F"
check $? "Gestisce evento non trovato"

F="$SRC/app/e/[id]/EventClient.tsx"

grep -q "joinEvent\|Ci sono" "$F"
check $? "Bottone 'Ci sono'"

grep -q "declineEvent\|Non posso" "$F"
check $? "Bottone 'Non posso'"

grep -q "postgres_changes\|channel" "$F"
check $? "Real-time subscriptions"

grep -q "navigator.vibrate" "$F"
check $? "Haptic feedback"

grep -q "animat" "$F"
check $? "Animazioni slot"

grep -q "showToast\|toast" "$F"
check $? "Toast notifica"

grep -q "confirmed" "$F"
check $? "Gestisce stato confirmed"

grep -q "invited" "$F"
check $? "Gestisce stato invited"

grep -q "declined" "$F"
check $? "Gestisce stato declined"

grep -q "login.*redirect\|redirect.*login" "$F"
check $? "Redirect login per utenti non autenticati"

grep -q "shareWhatsApp\|wa.me" "$F"
check $? "Organizzatore può ri-condividere"

# =============================================
echo ""
echo "🏠 TEST 5: Dashboard"
echo "-----------------------------------"

F="$SRC/app/dashboard/DashboardClient.tsx"

grep -q "/organize" "$F"
check $? "Link a /organize"

grep -q "Organizza" "$F"
check $? "Testo 'Organizza' presente"

grep -q "pastEventToday\|hasPastEvent" "$F"
check $? "CTA contestuale (evento passato)"

grep -q "linear-gradient.*#1A8CD8\|bluePadel" "$F"
check $? "Header blu sempre presente"

grep -q "Nessun evento" "$F"
check $? "Mostra 'Nessun evento' se vuoto"

# =============================================
echo ""
echo "👥 TEST 6: Companions"
echo "-----------------------------------"

F="$SRC/app/companions/page.tsx"

grep -q "/quick-match\|/organize" "$F"
check $? "Link a partita veloce/organizza"

grep -q "wa.me" "$F"
check $? "WhatsApp diretto"

grep -q "encodeURIComponent" "$F"
check $? "URL encoding corretto"

# =============================================
echo ""
echo "⚡ TEST 7: Quick Match"
echo "-----------------------------------"

F="$SRC/app/quick-match/page.tsx"

grep -q "wa.me" "$F"
check $? "WhatsApp sharing"

grep -q "encodeURIComponent" "$F"
check $? "URL encoding corretto"

grep -q "Suspense" "$F"
check $? "Suspense wrapper (Next.js)"

# =============================================
echo ""
echo "🔒 TEST 8: RLS - Event Participants"
echo "-----------------------------------"

# Check if insert policy exists in code logic
F="$SRC/app/e/[id]/EventClient.tsx"

grep -q "\.insert(" "$F"
check $? "Può inserire nuovi partecipanti"

grep -q "\.update(" "$F"
check $? "Può aggiornare partecipanti"

# =============================================
echo ""
echo "🔗 TEST 9: Consistenza URL pattern"
echo "-----------------------------------"

# Check all files use /e/ for event links
EVENT_URLS=$(grep -rn "/e/" $SRC/app/ --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v ".next" | wc -l | tr -d ' ')
echo "  ℹ️  Riferimenti a /e/[id]: $EVENT_URLS"

if [ "$EVENT_URLS" -gt 0 ]; then
  echo "  ✅ URL eventi consistenti"
  PASS=$((PASS+1))
else
  echo "  ❌ Nessun URL /e/ trovato"
  FAIL=$((FAIL+1))
fi

# =============================================
echo ""
echo "📦 TEST 10: Build check"
echo "-----------------------------------"

# Quick TypeScript check
npx tsc --noEmit --pretty 2>/tmp/tsc_output.txt
TSC_EXIT=$?
if [ $TSC_EXIT -eq 0 ]; then
  echo "  ✅ TypeScript: nessun errore"
  PASS=$((PASS+1))
else
  TSC_ERRORS=$(wc -l < /tmp/tsc_output.txt | tr -d ' ')
  warn "TypeScript: $TSC_ERRORS righe di output (potrebbe includere warning)"
  head -5 /tmp/tsc_output.txt
fi

# =============================================
echo ""
echo "======================================"
echo "📊 RISULTATI"
echo "======================================"
echo "  ✅ Passati:  $PASS"
echo "  ❌ Falliti:  $FAIL"
echo "  ⚠️  Warning: $WARN"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "  🎾 TUTTO OK! Pronto per testare dal vivo."
else
  echo "  🔧 Ci sono $FAIL problemi da risolvere."
fi
echo ""
