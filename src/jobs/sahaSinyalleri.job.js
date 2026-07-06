// src/jobs/sahaSinyalleri.job.js
//
// "7/24 DİJİTAL BEKÇİ" — Saha Sinyalleri (Ön-Öncelik Bildirimi)
//
// ÖNEMLİ SINIR (TBB Reklam Yasağı Yönetmeliği uyumu — CEO onayı, madde: bekçi
// modeli): Bu bot HİÇBİR ZAMAN bir isme/aileye doğrudan ulaşmaz, mail/SMS/arama
// başlatmaz. Sadece KAMUYA AÇIK haber kaynaklarını (Google News RSS, ücretsiz)
// "trafik kazası" + "hayatını kaybetti" gibi kalıplarla tarar ve bölge/tarih/
// kaynak özetini admin panelde bir "sinyal" olarak listeler. Kararı ve temasın
// nasıl kurulacağını TAMAMEN insan (temsilci) verir, mevcut saha yöntemiyle.
// Bu bot iş sağlama amacına yönelik bir girişim değildir — sadece bilgi
// önceliklendirmesidir; doğrudan temas otomasyonu KESİNLİKLE eklenmeyecektir.
//
// $0 maliyet: Google News RSS herkese açık ve ücretsizdir, üçüncü parti servise
// abonelik gerekmez.

"use strict";

const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const logger = require("../config/logger");

const CACHE_PATH = path.resolve(__dirname, "../../tedbirge-os/data/saha-sinyalleri.json");

// Niş ile doğrudan ilgili, gerçekten haberleşen kaza türleri.
const SORGULAR = [
  { q: "trafik kazası hayatını kaybetti", kategori: "Trafik — Vefat" },
  { q: "trafik kazası ağır yaralı", kategori: "Trafik — Ağır Yaralanma" },
  { q: "iş kazası hayatını kaybetti", kategori: "İş Kazası — Vefat" },
  { q: "iş kazası yaralandı", kategori: "İş Kazası — Yaralanma" },
];

function buildRssUrl(query) {
  const encoded = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${encoded}&hl=tr&gl=TR&ceid=TR:tr`;
}

/** Basit, bağımlılıksız RSS <item> ayrıştırıcı (ağır bir xml2js eklemeden). */
function parseRssItems(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const block of itemBlocks.slice(0, 5)) {
    const title = (block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
    const link = (block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "";
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "";
    const source = (block.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || "";
    items.push({
      baslik: title.replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
      link: link.trim(),
      tarih: pubDate.trim(),
      kaynak: source.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "Google Haberler",
    });
  }
  return items;
}

async function fetchSinyaller() {
  const toplanan = [];
  const gorulenBasliklar = new Set();

  for (const sorgu of SORGULAR) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(buildRssUrl(sorgu.q), { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`RSS ${res.status}`);
      const xml = await res.text();
      const items = parseRssItems(xml);

      for (const item of items) {
        if (!item.baslik || gorulenBasliklar.has(item.baslik)) continue;
        gorulenBasliklar.add(item.baslik);
        toplanan.push({ ...item, kategori: sorgu.kategori });
      }
    } catch (err) {
      logger.warn(`[SahaSinyalleri] "${sorgu.q}" taraması atlandı: ${err.message}`);
    }
  }

  return toplanan;
}

async function runSahaSinyalleri() {
  logger.info("[SahaSinyalleri] Tarama başladı — sadece kamuya açık haber başlıkları, otomatik temas YOK");
  const sinyaller = await fetchSinyaller();

  if (sinyaller.length === 0) {
    logger.warn("[SahaSinyalleri] Yeni sinyal bulunamadı — mevcut cache korunuyor");
    return { ok: false, count: 0 };
  }

  const kayit = {
    generatedAt: new Date().toISOString(),
    not: "Bu liste yalnızca KAMUYA AÇIK haber başlıklarından oluşur. Otomatik temas YOKTUR — sadece saha ekibi için önceliklendirme sinyalidir.",
    sinyaller: sinyaller.slice(0, 30),
  };

  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(kayit, null, 2), "utf-8");
    logger.info(`[SahaSinyalleri] Tamamlandı — ${kayit.sinyaller.length} sinyal cache'lendi`);
    return { ok: true, count: kayit.sinyaller.length };
  } catch (err) {
    logger.error(`[SahaSinyalleri] Cache yazma hatası: ${err.message}`);
    return { ok: false, count: 0 };
  }
}

function startSahaSinyalleri() {
  // Günde 2 kez (08:00 ve 18:00) — haber döngüsüyle makul uyum, RSS'i yormaz.
  cron.schedule("0 8,18 * * *", () => {
    runSahaSinyalleri().catch((err) =>
      logger.error(`[SahaSinyalleri] Beklenmeyen hata: ${err.message}`)
    );
  });
  logger.info("[SahaSinyalleri] Otonom bekçi cron job başlatıldı (günlük 08:00 ve 18:00)");

  if (!fs.existsSync(CACHE_PATH)) {
    runSahaSinyalleri().catch((err) =>
      logger.error(`[SahaSinyalleri] İlk çalıştırma hatası: ${err.message}`)
    );
  }
}

module.exports = { startSahaSinyalleri, runSahaSinyalleri };
