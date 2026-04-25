═══════════════════════════════════════════════════════════
ANAYASA GENİŞLETME — MADDE 5.5 EKLEME
═══════════════════════════════════════════════════════════

Mehmet Bey direktifi: Read-only komutlar için sürekli onay gereksiz, mimar yorgunluğu yaratıyor. Anayasaya yeni madde ekleniyor.

═══════════════════════════════════════════════════════════
ADIM 1: CLAUDE.md'ye Madde 5.5 ekle
═══════════════════════════════════════════════════════════

CLAUDE.md dosyasını oku, "## 5. DURMA ŞARTLARI" bölümünden hemen önce şu içeriği ekle. str_replace ile, atom değişiklik:

ARANACAK (eski, mevcut):
---
**Yasak listeyi mimar yazar.** Claude Code yasakları **kıramaz**, kırarsa o noktada **durur**, **sohbete döner**.

---

## 5. Durma şartları (Otomatik DUR + Sohbete Dön)
---

DEGIŞTİRİLECEK (yeni, bunu yaz):
---
**Yasak listeyi mimar yazar.** Claude Code yasakları **kıramaz**, kırarsa o noktada **durur**, **sohbete döner**.

---

## 5. ONAY DİSİPLİNİ — READ-ONLY VS YAZMA OPERASYONLARI

### 5.1 Otomatik onay verilebilir (Read-only komutlar)

Claude Code'da "Yes, and don't ask again" ile **işaretlenebilir**:

✅ **Git okuma:**
- `git diff *`
- `git status *`
- `git log *`
- `git show *`
- `git branch *` (listeleme)

✅ **Dosya okuma:**
- `view *` (Claude Code kendi tool'u)
- `Get-Content *` (PowerShell)
- `Get-Item *`
- `Get-ChildItem *`
- `Select-String *` (grep)
- `Test-Path *`

✅ **Sistem bilgisi:**
- `Measure-Object *`
- `Format-Table *`
- `Select-Object *`
- `wc *`, `head *`, `tail *`, `cat *` (read-only Linux)

✅ **Network sağlık kontrolü (sadece bilinen production endpoint):**
- `Invoke-RestMethod -Uri 'https://tedbirge-ai.onrender.com/health'`
- `curl https://tedbirge-ai.onrender.com/health`

**Mantık:** Bu komutlar **sapma üretemez** — dosya değiştirmez, veri silmez, network'e zarar vermez. Mimar denetimi gerekmez.

### 5.2 İnsan onayı HER ZAMAN gerekir (Yazma operasyonları)

Claude Code asla "don't ask again" işaretlemez:

🔒 **Git yazma:**
- `git commit *`
- `git push *` (production'a etkisi var)
- `git revert *`
- `git reset *`
- `git checkout *` (branch değişimi)
- `git merge *`
- `git rebase *`

🔒 **Dosya değiştirme:**
- `str_replace *`
- `create_file *`
- `Move-Item *`
- `Copy-Item *`
- `Remove-Item *`
- `New-Item *` (file/directory oluşturma)
- `Out-File *`
- `Set-Content *`

🔒 **Sistem değişikliği:**
- `npx prisma migrate *`
- `npx prisma db *`
- `npm install/uninstall/update *`
- `cd *` ile birlikte zincirleme komutlar (compound)

🔒 **Network yazma:**
- `Invoke-RestMethod -Method POST/PUT/DELETE *`
- `curl -X POST/PUT/DELETE *`

**Mantık:** Bu komutlar **gerçek dünya etkisi** yapar. Sapma → zarar. Mimar denetimi şart.

### 5.3 Belirsiz pattern → onay iste

Komut yukarıdaki kategorilerden hiçbirine net girmiyorsa: **default onay iste**. Kuşku otomatik onaydan iyidir.

### 5.4 Onay disiplini ihlali → DUR

Eğer Claude Code yanlışlıkla yazma operasyonunu otomatik onayla yaparsa → **DUR + sohbete dön**. Ne kadar küçük olursa olsun.

---

## 6. Durma şartları (Otomatik DUR + Sohbete Dön)
---

NOT: Eski "## 5. DURMA ŞARTLARI" başlığı "## 6." olacak. Sonraki bölümler otomatik kayar (eski 6 → 7, 7 → 8, vb.). Bu nedenle str_replace yaparken bütünlüğü koru.

═══════════════════════════════════════════════════════════
ADIM 2: Doğrula
═══════════════════════════════════════════════════════════

git diff CLAUDE.md komutuyla değişikliği gör. Sadece Madde 5'in genişlemesi olmalı, başka şey değil.

═══════════════════════════════════════════════════════════
ADIM 3: Commit + push
═══════════════════════════════════════════════════════════

git add CLAUDE.md
git commit -m "docs(anayasa): Madde 5 - Onay disiplini (read-only vs yazma)"
git push origin master

═══════════════════════════════════════════════════════════
ADIM 4: BİTİRİŞ MESAJI
═══════════════════════════════════════════════════════════

Sonra şu mesajı bas:

═══════════════════════════════════════════════════════════
ANAYASA GENİŞLETMESİ TAMAM

✅ CLAUDE.md Madde 5 eklendi
✅ Onay disiplini netleşti:
   - Read-only komutlar: don't ask again uygun
   - Yazma operasyonları: her zaman onay
✅ Commit + push tamamlandı

Mehmet Bey, bundan sonra git diff/status/log gibi
read-only komutlarda "Yes, and don't ask again" 
seçebilirsin. Kontrol elinde, ama yorulmayacaksın.

— Claude Code
═══════════════════════════════════════════════════════════

Sonra DUR. TUR #2 (Faz C — Auditor + Healer + Reporter) için mimar oturumu bekle.
