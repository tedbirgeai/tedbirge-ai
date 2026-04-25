#!/bin/bash
cd /c/Users/WIN10/Desktop/tedbirge.ai
exec > /c/Users/WIN10/Downloads/TEDBIRGE_GUVENLI_KESIF.txt

echo "TEDBIRGE.AI GUVENLI KESIF — SIFRE FILTRELI"
date
echo ""

echo "================================================"
echo "1. DIZIN AGACI"
echo "================================================"
find . -maxdepth 5 -type d -not -path "*/node_modules*" -not -path "*/.git*" -not -path "*/.next*" 2>/dev/null | sort

echo ""
echo "================================================"
echo "2. JS/TS DOSYA BOYUTLARI"
echo "================================================"
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules*" 2>/dev/null | xargs wc -l 2>/dev/null | sort -rn | head -50

echo ""
echo "================================================"
echo "3. PACKAGE.JSON BACKEND"
echo "================================================"
cat package.json 2>/dev/null

echo ""
echo "================================================"
echo "4. SRC YAPI"
echo "================================================"
find src/ -maxdepth 2 -type d 2>/dev/null | sort

echo ""
echo "================================================"
echo "5. CONFIG FILTRELI"
echo "================================================"
for f in src/config/*.js; do
  [ -f "$f" ] && echo "----- $f -----" && sed -E "s/(postgresql:\/\/[^:]+:)[^@]+(@)/\1***\2/g; s/(sk-ant-api03-)[A-Za-z0-9_-]{10,}/\1***/g; s/([A-Z_]*PASSWORD[A-Z_]*=)[^ ]*/\1***/g; s/([A-Z_]*SECRET[A-Z_]*=)[^ ]*/\1***/g; s/([A-Z_]*KEY[A-Z_]*=)[^ ]*/\1***/g; s/([A-Z_]*TOKEN[A-Z_]*=)[^ ]*/\1***/g" "$f" && echo ""
done

echo ""
echo "================================================"
echo "6. MIDDLEWARE"
echo "================================================"
for f in src/middleware/*.js; do
  [ -f "$f" ] && echo "----- $f -----" && cat "$f" && echo ""
done

echo ""
echo "================================================"
echo "7. 9 ADAPTER"
echo "================================================"
for f in src/os/adapters/*.js; do
  echo "----- $f -----"
  sed -E "s/(postgresql:\/\/[^:]+:)[^@]+(@)/\1***\2/g; s/(sk-ant-api03-)[A-Za-z0-9_-]{10,}/\1***/g; s/([A-Z_]*PASSWORD[A-Z_]*=)[^ ]*/\1***/g; s/([A-Z_]*SECRET[A-Z_]*=)[^ ]*/\1***/g; s/([A-Z_]*KEY[A-Z_]*=)[^ ]*/\1***/g; s/([A-Z_]*TOKEN[A-Z_]*=)[^ ]*/\1***/g" "$f" 2>/dev/null
  echo ""
done

echo ""
echo "================================================"
echo "8. 16 OS MODUL"
echo "================================================"
for f in src/os/modules/*.js; do
  echo "----- $f -----"
  cat "$f" 2>/dev/null
  echo ""
done

echo ""
echo "================================================"
echo "9. OS CORE"
echo "================================================"
for f in src/os/*.js; do
  [ -f "$f" ] && echo "----- $f -----" && cat "$f" && echo ""
done

echo ""
echo "================================================"
echo "10. CONTROLLER"
echo "================================================"
for f in src/controllers/*.js; do
  echo "----- $f -----"
  cat "$f" 2>/dev/null
  echo ""
done

echo ""
echo "================================================"
echo "11. ROUTE"
echo "================================================"
for f in src/routes/*.js; do
  echo "----- $f -----"
  cat "$f" 2>/dev/null
  echo ""
done

echo ""
echo "================================================"
echo "12. SERVIS FILTRELI"
echo "================================================"
for f in src/services/*.js; do
  echo "----- $f -----"
  sed -E "s/(postgresql:\/\/[^:]+:)[^@]+(@)/\1***\2/g; s/(sk-ant-api03-)[A-Za-z0-9_-]{10,}/\1***/g; s/([A-Z_]*PASSWORD[A-Z_]*=)[^ ]*/\1***/g; s/([A-Z_]*SECRET[A-Z_]*=)[^ ]*/\1***/g; s/([A-Z_]*KEY[A-Z_]*=)[^ ]*/\1***/g; s/([A-Z_]*TOKEN[A-Z_]*=)[^ ]*/\1***/g" "$f" 2>/dev/null
  echo ""
done

echo ""
echo "================================================"
echo "13. ENTRY POINTLER"
echo "================================================"
for f in index.js server.js src/app.js src/index.js; do
  [ -f "$f" ] && echo "----- $f -----" && cat "$f" && echo ""
done

echo ""
echo "================================================"
echo "14. PRISMA SCHEMA"
echo "================================================"
cat prisma/schema.prisma 2>/dev/null

echo ""
echo "================================================"
echo "15. ENV ADLARI"
echo "================================================"
grep -E "^[A-Z_]+=" .env 2>/dev/null | cut -d= -f1 | sort

echo ""
echo "================================================"
echo "16. DEPLOY CONFIG"
echo "================================================"
[ -f render.yaml ] && echo "----- render.yaml -----" && cat render.yaml
[ -f Dockerfile ] && echo "----- Dockerfile -----" && head -30 Dockerfile

echo ""
echo "================================================"
echo "17. PANEL PACKAGE"
echo "================================================"
cat tedbirge-panel/package.json 2>/dev/null

echo ""
echo "================================================"
echo "18. PANEL LIB"
echo "================================================"
for f in tedbirge-panel/lib/*.ts tedbirge-panel/lib/*.tsx; do
  [ -f "$f" ] && echo "----- $f -----" && cat "$f" && echo ""
done

echo ""
echo "================================================"
echo "19. PANEL SISTEM DURUMU"
echo "================================================"
cat "tedbirge-panel/app/(panel)/dashboard/sistem-durumu/page.tsx" 2>/dev/null

echo ""
echo "================================================"
echo "20. TASK_QUEUE"
echo "================================================"
cat tedbirge-os/TASK_QUEUE.md 2>/dev/null

echo ""
echo "================================================"
echo "GUVENLI KESIF BITTI"
echo "================================================"
