# Tedbirge.ai — Font Pipeline

**TUR #112 — Premium Kartvizit Disiplini (Madde 30.65)**

## İçerik

| Dosya | Boyut | Aile | Ağırlık | Kullanım |
|---|---|---|---|---|
| InterTight-Regular.ttf | 58 KB | Inter Tight | 400 | UI gövde metin |
| InterTight-Medium.ttf | 58 KB | Inter Tight | 500 | Vurgu |
| InterTight-Bold.ttf | 58 KB | Inter Tight | 700 | Başlık |
| CrimsonPro-Regular.ttf | 47 KB | Crimson Pro | 400 | Slogan/italic |
| CrimsonPro-SemiBold.ttf | 47 KB | Crimson Pro | 600 | İsim (sub) |
| CrimsonPro-Bold.ttf | 47 KB | Crimson Pro | 700 | İsim (ana) |
| JetBrainsMono-Regular.ttf | 57 KB | JetBrains Mono | 400 | Telefon/email/URL |

**Toplam:** ~376 KB

## Lisans — SIL Open Font License (OFL) 1.1

3 fontun tümü **OFL 1.1** lisanslı — ticari kullanım, değiştirme, paketleme **izinli**. Tek koşul: lisans metni dağıtımla birlikte gelir (bkz. https://scripts.sil.org/OFL).

- **Inter Tight** — Rasmus Andersson / Google Fonts — https://fonts.google.com/specimen/Inter+Tight
- **Crimson Pro** — Sebastian Kosch / Jacques Le Bailly / Google Fonts — https://fonts.google.com/specimen/Crimson+Pro
- **JetBrains Mono** — JetBrains s.r.o. / Google Fonts — https://fonts.google.com/specimen/JetBrains+Mono

## Kaynak — jsdelivr fontsource CDN

İndirilme tarihi: **12 Mayıs 2026 Salı (TUR #112)**

Origin: `https://cdn.jsdelivr.net/fontsource/fonts/{family}@latest/latin-{weight}-normal.ttf` (jsdelivr CDN, fontsource paketleri Google Fonts'un repackaged TTF dağıtımı, OFL lisans aynen geçer)

## Kullanım (Madde 30.65 — Premium Kartvizit Disiplini)

**Backend (PDF):**
```js
const doc = new PDFDocument(...);
doc.registerFont('Inter-Regular', path.join(__dirname, 'tedbirge-os/assets/fonts/InterTight-Regular.ttf'));
doc.font('Inter-Regular').fontSize(14).text('Türkçe karakterler: ŞüĞç ✓');
```

**Backend (SVG):**
`corporate.service.js` içinde TTF base64 olarak SVG `<style>` bloğuna gömülür. Bu sayede indirilen SVG offline da düzgün render olur.

## Madde 24.14 — $0 maliyet

Sıfır API çağrısı, sıfır lisans ücreti, sıfır npm install. OFL = ücretsiz dağıtım hakkı.

## Üretim notu

Production deploy sırasında bu klasör **repo'ya commit'li** olmalı. `tedbirge-os/assets/fonts/*.ttf` Render build context'inde mevcut olur. pdfkit `registerFont` mutlak path ile bulur (`path.join(process.cwd(), 'tedbirge-os/assets/fonts/...')`).
