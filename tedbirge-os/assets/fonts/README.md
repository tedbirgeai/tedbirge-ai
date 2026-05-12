# Tedbirge.ai — Font Pipeline

**TUR #112 HOTFIX — Türkçe karakter desteği için variable font'a geçildi (Madde 30.65)**

## İçerik

| Dosya | Boyut | Aile | Variation Axis | Kullanım |
|---|---|---|---|---|
| InterTight-VF.ttf | 568 KB | Inter Tight | `wght` 100-900 | UI gövde / başlık / vurgu |
| CrimsonPro-VF.ttf | 241 KB | Crimson Pro | `wght` 200-900 | İsim (bold) / slogan (italic regular) |
| JetBrainsMono-VF.ttf | 183 KB | JetBrains Mono | `wght` 100-800 | Telefon / email / URL (mono) |

**Toplam:** ~992 KB (3 dosya). Variable font format — tek dosya tüm weight'leri içerir.

## Glyph coverage (Türkçe doğrulanmış)

```
InterTight-VF.ttf      → 2547 glyph, Türkçe 17/17 ✓ (Ş ş Ğ ğ İ ı Ç ç Ö ö Ü ü ...)
CrimsonPro-VF.ttf      →  832 glyph, Türkçe 17/17 ✓
JetBrainsMono-VF.ttf   → 1179 glyph, Türkçe 17/17 ✓
```

## Hotfix nedeni (TUR #112 ilk pipeline'dan değişim)

İlk indirme: jsdelivr `@fontsource` paketleri — `latin-400-normal.ttf` **BASIC Latin subset**. `Ş ş Ğ ğ İ` U+015E/U+015F/U+011E/U+011F/U+0130 **YOK** → PDF Matbaa Türkçe karakter `Hakkı[]ı`, `Gü[]ah` gibi `.notdef` boşluk render etti.

Çözüm: Google Fonts variable font (`github.com/google/fonts/raw/main/ofl/{family}/{Name}[wght].ttf`) — tüm glyph'leri tek dosyada içerir, OFL lisansı aynı. pdfkit + SVG `@font-face` her ikisi de variable font destekler (browser tarafında `format('truetype-variations')`).

## Lisans — SIL Open Font License (OFL) 1.1

3 fontun tümü **OFL 1.1** lisanslı — ticari kullanım, değiştirme, paketleme izinli. Lisans metni: https://scripts.sil.org/OFL

- **Inter Tight** — Rasmus Andersson / Google Fonts
- **Crimson Pro** — Sebastian Kosch / Jacques Le Bailly / Google Fonts
- **JetBrains Mono** — JetBrains s.r.o. / Google Fonts

## Kaynak — github.com/google/fonts

İndirilme tarihi: **12 Mayıs 2026 Salı (TUR #112 HOTFIX)**

Origin URL'ler:
- `https://github.com/google/fonts/raw/main/ofl/intertight/InterTight[wght].ttf`
- `https://github.com/google/fonts/raw/main/ofl/crimsonpro/CrimsonPro[wght].ttf`
- `https://github.com/google/fonts/raw/main/ofl/jetbrainsmono/JetBrainsMono[wght].ttf`

## Kullanım (Madde 30.65 — Premium Kartvizit Disiplini)

**Backend (PDF, pdfkit):**
```js
const doc = new PDFDocument(...);
doc.registerFont('Inter', path.join(__dirname, '../../tedbirge-os/assets/fonts/InterTight-VF.ttf'));
doc.registerFont('Crimson', path.join(__dirname, '../../tedbirge-os/assets/fonts/CrimsonPro-VF.ttf'));
doc.registerFont('Mono', path.join(__dirname, '../../tedbirge-os/assets/fonts/JetBrainsMono-VF.ttf'));
doc.font('Inter').fontSize(14).text('Türkçe: Şükrü Çağrı Ümit Öztürk ✓');
```

**Backend (SVG, base64 embed):**
```css
@font-face {
  font-family: 'Inter Tight';
  src: url(data:font/ttf;base64,XXX) format('truetype-variations');
  font-weight: 100 900;
}
```

## Bold/Regular weight ayrımı

Variable font ile pdfkit'in current versiyonu (`0.18.0`) text rendering sırasında variation axis'i otomatik **default weight'te** uygular (genelde Regular). Bold/Medium visual ayrımı için ileride pdfkit upgrade veya font instance pre-render gerekecek. Bu **sari endişe** — TUR #113+ teknik borç.

SVG tarafında modern tarayıcılar `font-weight: 700` CSS'i variable font'tan dinamik weight olarak alır → SVG önizlemede Bold doğru render olur. Production'da PDF visual hafif monoton ama Türkçe karakterler **doğru** render eder (öncelik).

## Madde 24.14 — $0 maliyet

Sıfır API çağrısı, sıfır lisans ücreti, sıfır npm install. OFL = ücretsiz dağıtım hakkı. github.com raw indirme ücretsiz.

## Üretim notu

Production deploy sırasında bu klasör **repo'ya commit'li** olmalı. `tedbirge-os/assets/fonts/*.ttf` Render build context'inde mevcut olur. pdfkit `registerFont` mutlak path ile bulur (`path.join(__dirname, '../../tedbirge-os/assets/fonts/...')`).
