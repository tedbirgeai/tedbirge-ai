# MIGRATION DRIFT FIX — RENDER SHELL SQL

> Mehmet Bey Render Shell'de calistiracak.
> Risk: Dusuk (additive, IF NOT EXISTS, mevcut veri etkilenmez).
> Sure: 5 dakika.

## Adimlar

1. https://dashboard.render.com → tedbirge-ai → Shell sekmesi
2. Asagidaki tek bloku yapistir, Enter:

```bash
psql "$DIRECT_URL" <<'EOF'
ALTER TABLE "Bilirkisi" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Durusma" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Masraf" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "UYAPDosyaSync" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "UYAPTebligat" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "DataSubjectRequest" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "SBMSorgu" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "AccidentCase" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
EOF
```

3. Dogrulama (ayni Shell'de):
```bash
psql "$DIRECT_URL" -c "SELECT table_name, column_name FROM information_schema.columns WHERE column_name = 'updatedAt' AND table_schema = 'public' ORDER BY table_name;"
```

**Beklenen:** 19 satir (onceki 11 + yeni 8).

4. Ciktıyı sohbete yapistir.
