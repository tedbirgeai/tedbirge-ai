// src/jobs/haberlerRefresh.job.js
//
// OTONOM HUKUKİ HABERLER — /haberler sayfasını gerçek, resmi Yargıtay
// kararlarıyla günde bir kez otomatik günceller ($0, dış ücretli servis yok).
//
// Kaynak: bedesten.service.js → bedesten.adalet.gov.tr (T.C. Adalet Bakanlığı
// resmi arka ucu). Sahte/uydurma veri YOK — sadece gerçek karar künyesi
// (esas/karar no, daire, tarih) kullanılır.
//
// 0 hata ilkesi: yeni Prisma tablosu/migration YOK — sonuç, mevcut FAQ/
// custom-intents dosyalarıyla aynı desende bir JSON dosyasına yazılır
// (tedbirge-os/data/haberler-cache.json). Panel bu dosyayı okuyan bir
// public endpoint'ten (GET /api/public/haberler) çeker. Bedesten'e
// ulaşılamazsa (hız limiti/geçici kesinti) mevcut cache dosyası olduğu
// gibi kalır — sayfa asla boş/kırık görünmez.

"use strict";

const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const logger = require("../config/logger");
const bedesten = require("./../services/bedesten.service");

const CACHE_PATH = path.resolve(__dirname, "../../tedbirge-os/data/haberler-cache.json");

// Nişimizle (trafik/iş kazası tazminatı) doğrudan ilgili, gerçekten aranan
// konular — her biri ayrı bir Bedesten araması, hız limiti nedeniyle azar
// azar (aralarında ~3.5sn bekleme zaten bedesten.service.js içinde var).
const KONULAR = [
  { phrase: "trafik kazası tazminat", kategori: "Trafik" },
  { phrase: "iş kazası tazminat", kategori: "İş Kazası" },
  { phrase: "maluliyet oranı tazminat", kategori: "Yargıtay" },
  { phrase: "destekten yoksun kalma tazminatı", kategori: "Trafik" },
  { phrase: "manevi tazminat kaza", kategori: "Yargıtay" },
];

// EKLENTİ — SGK/Mevzuat kaynağı: Bedesten SADECE mahkeme kararlarını kapsar,
// SGK genelgeleri/Resmi Gazete duyuruları farklı bir kaynak gerektirir.
// $0, kamuya açık, resmi/güvenilir haber kaynaklarını (Google Haberler RSS)
// tarayan aynı desen (bkz. sahaSinyalleri.job.js) — sahte veri YOK, sadece
// gerçek haber başlığı + kaynak + link.
const MEVZUAT_SORGULARI = [
  { q: "SGK genelge iş kazası", kategori: "SGK" },
  { q: "ZMSS Resmi Gazete SEDDK", kategori: "Mevzuat" },
  { q: "trafik sigortası yönetmelik değişikliği", kategori: "Mevzuat" },
];

function buildMevzuatRssUrl(query) {
  const encoded = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${encoded}&hl=tr&gl=TR&ceid=TR:tr`;
}

function parseMevzuatRssItems(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const block of itemBlocks.slice(0, 3)) {
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

async function fetchMevzuatHaberleri() {
  const toplanan = [];
  for (const sorgu of MEVZUAT_SORGULARI) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(buildMevzuatRssUrl(sorgu.q), { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`RSS ${res.status}`);
      const xml = await res.text();
      const items = parseMevzuatRssItems(xml);
      for (const item of items) {
        if (!item.baslik) continue;
        toplanan.push({
          baslik: item.baslik,
          ozet: `Kaynak: ${item.kaynak}. Güncel SGK/mevzuat gelişmesi — tam metin için habere gidin.`,
          kategori: sorgu.kategori,
          tarih: item.tarih || null,
          link: item.link || null,
        });
      }
    } catch (err) {
      logger.warn(`[HaberlerRefresh] Mevzuat "${sorgu.q}" araması atlandı: ${err.message}`);
    }
  }
  return toplanan;
}

function ozetUret(k, kategori) {
  const daire = k.birimAdi || "Yargıtay";
  const tur = k.kararTuru ? ` — ${k.kararTuru}` : "";
  return {
    baslik: `${daire}: Esas ${k.esasNo || "?"} / Karar ${k.kararNo || "?"}${tur}`,
    ozet: `${daire} tarafından ${k.tarih || "bilinmeyen tarihte"} verilen emsal karar. Kaynak: T.C. Adalet Bakanlığı resmi karar veritabanı (bedesten.adalet.gov.tr).`,
    kategori,
    tarih: k.tarih || null,
    documentId: k.documentId,
  };
}

async function runHaberlerRefresh() {
  logger.info("[HaberlerRefresh] Başladı — gerçek Yargıtay kararları + SGK/mevzuat taranıyor");
  const toplanan = [];
  const gorulenIds = new Set();

  for (const konu of KONULAR) {
    try {
      const kararlar = await bedesten.searchEmsalKararlar({ phrase: konu.phrase, pageSize: 2 });
      for (const k of kararlar) {
        if (gorulenIds.has(k.documentId)) continue;
        gorulenIds.add(k.documentId);
        toplanan.push(ozetUret(k, konu.kategori));
      }
    } catch (err) {
      // Tek bir konu başarısız olsa da diğerleri denenmeye devam eder —
      // kısmi güncelleme, sıfır çökme.
      logger.warn(`[HaberlerRefresh] "${konu.phrase}" araması atlandı: ${err.message}`);
    }
  }

  // EKLENTİ — SGK/Mevzuat haberleri (Yargıtay kararlarından ayrı kaynak).
  try {
    const mevzuatHaberleri = await fetchMevzuatHaberleri();
    toplanan.push(...mevzuatHaberleri);
  } catch (err) {
    logger.warn(`[HaberlerRefresh] Mevzuat taraması genel hata: ${err.message}`);
  }

  if (toplanan.length === 0) {
    logger.warn("[HaberlerRefresh] Hiç yeni karar bulunamadı — mevcut cache korunuyor");
    return { ok: false, count: 0 };
  }

  // Tarihe göre sırala (yeni üstte), en fazla 20 kayıt tut.
  toplanan.sort((a, b) => (b.tarih || "").localeCompare(a.tarih || ""));
  const kayit = {
    generatedAt: new Date().toISOString(),
    kaynak: "bedesten.adalet.gov.tr (T.C. Adalet Bakanlığı resmi karar veritabanı)",
    haberler: toplanan.slice(0, 20),
  };

  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(kayit, null, 2), "utf-8");
    logger.info(`[HaberlerRefresh] Tamamlandı — ${kayit.haberler.length} gerçek karar cache'lendi`);
    return { ok: true, count: kayit.haberler.length };
  } catch (err) {
    logger.error(`[HaberlerRefresh] Cache yazma hatası: ${err.message}`);
    return { ok: false, count: 0 };
  }
}

function startHaberlerRefresh() {
  // Her gün 06:00 — Bedesten'in gündüz yoğunluğundan kaçınmak için erken saat.
  cron.schedule("0 6 * * *", () => {
    runHaberlerRefresh().catch((err) =>
      logger.error(`[HaberlerRefresh] Beklenmeyen hata: ${err.message}`)
    );
  });
  logger.info("[HaberlerRefresh] Otonom haber güncelleme cron job başlatıldı (günlük 06:00)");

  // İlk açılışta cache boşsa/yoksa hemen bir kez çalıştır (kullanıcı boş sayfa görmesin).
  if (!fs.existsSync(CACHE_PATH)) {
    runHaberlerRefresh().catch((err) =>
      logger.error(`[HaberlerRefresh] İlk çalıştırma hatası: ${err.message}`)
    );
  }
}

module.exports = { startHaberlerRefresh, runHaberlerRefresh };
