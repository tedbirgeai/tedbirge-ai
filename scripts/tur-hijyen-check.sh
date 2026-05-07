#!/usr/bin/env bash
# TUR #95 H4 — Pre-Commit / Pre-Push Hijyen Kontrol (Madde 14.4)
# Mimar hatası 5 kategoriden erken tespit:
#   30.42 Working tree temizlik
#   30.46 Lockfile sync (package.json ↔ package-lock.json mtime delta)
#   30.22 Schema migration apply hook varlığı
#   30.50 + 30.52 Smoke ipucu (manuel)
#   30.26 5 OS dosya senkron son commit
#
# Kullanım: bash scripts/tur-hijyen-check.sh

set -uo pipefail

echo "🔍 TUR Hijyen Kontrol — $(date +'%Y-%m-%d %H:%M:%S')"
echo ""

ISSUES=0
WARNINGS=0

# 1. Working tree clean (Madde 30.42)
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "⚠️  Working tree kirli (Madde 30.42 ihlal):"
  git status --short 2>/dev/null | head -5
  WARNINGS=$((WARNINGS+1))
else
  echo "✅ Working tree clean (Madde 30.42)"
fi

# 2. Lockfile sync delta (Madde 30.46)
echo ""
echo "📦 Lockfile sync (Madde 30.46):"
LOCKFILE_OK=1
for repo in tedbirge-panel .; do
  PJ="$repo/package.json"
  PL="$repo/package-lock.json"
  if [ -f "$PJ" ] && [ -f "$PL" ]; then
    PJ_MTIME=$(stat -c %Y "$PJ" 2>/dev/null || stat -f %m "$PJ" 2>/dev/null || echo 0)
    PL_MTIME=$(stat -c %Y "$PL" 2>/dev/null || stat -f %m "$PL" 2>/dev/null || echo 0)
    DELTA=$((PJ_MTIME - PL_MTIME))
    DELTA_ABS=${DELTA#-}
    REPO_LABEL="${repo}"
    [ "$repo" = "." ] && REPO_LABEL="tedbirge-ai (root)"
    if [ "$DELTA_ABS" -gt 60 ]; then
      echo "  ❌ $REPO_LABEL: package.json ↔ package-lock.json delta ${DELTA_ABS}s > 60s (npm install eksik?)"
      ISSUES=$((ISSUES+1))
      LOCKFILE_OK=0
    else
      echo "  ✅ $REPO_LABEL: delta ${DELTA_ABS}s OK"
    fi
  fi
done

# 3. Schema migration apply hook (Madde 30.22)
echo ""
echo "🗄️  Schema migration apply hook (Madde 30.22):"
if [ -f "scripts/apply-pending-schemas.js" ]; then
  echo "  ✅ scripts/apply-pending-schemas.js mevcut"
else
  echo "  ⚠️  scripts/apply-pending-schemas.js eksik"
  WARNINGS=$((WARNINGS+1))
fi

# 4. Smoke ipucu (Madde 30.50 + 30.52)
echo ""
echo "🧪 Smoke ipucu (manuel — Madde 30.50 + 30.52):"
echo "  ℹ️  Auth flow değiştiyse: NUM_REDIRECTS smoke (4 rol × 2 2FA = 8 senaryo)"
echo "  ℹ️  Login endpoint değiştiyse: 4 rol × yanlış şifre POST → 401 + 'Gecersiz' mesaj"

# 5. 5 OS dosya senkron son commit (Madde 30.26)
echo ""
echo "📝 5 OS dosya senkron son commit (Madde 30.26):"
if [ -d ".git" ]; then
  LAST_FILES=$(git log -1 --name-only --pretty=format: 2>/dev/null | grep -v '^$' || echo "")
  REQUIRED=("CLAUDE.md" "DEVIR_RAPORU_AKTIF.md" "IS_PLANI.md" "MIMARI_KARARLAR.md" "OTONOM_RAPOR.md")
  PRESENT=0
  for f in "${REQUIRED[@]}"; do
    if echo "$LAST_FILES" | grep -qE "$f"; then
      PRESENT=$((PRESENT+1))
    fi
  done
  if [ "$PRESENT" -eq 5 ]; then
    echo "  ✅ 5/5 OS dosya son commit'te (TUR kapanışı pattern)"
  elif [ "$PRESENT" -ge 1 ]; then
    echo "  ℹ️  $PRESENT/5 OS dosya son commit'te (TUR kapanışı eksik olabilir)"
  else
    echo "  ℹ️  Son commit OS dosya değil (kod commit'i — normal)"
  fi
fi

echo ""
echo "📊 ÖZET:"
echo "  Issues: $ISSUES"
echo "  Warnings: $WARNINGS"

if [ "$ISSUES" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo "✅ Hijyen tamam — TUR commit/push güvenli"
  exit 0
elif [ "$ISSUES" -eq 0 ]; then
  echo "⚠️  $WARNINGS uyarı — devam edebilirsin ama dikkat"
  exit 0
else
  echo "❌ $ISSUES kritik hijyen sorunu — DURDUR"
  exit 1
fi
