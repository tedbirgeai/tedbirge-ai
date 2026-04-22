// src/services/sureMotoru.service.test.js
// -----------------------------------------------------------------------------
// Manuel dogrulama scripti.
// Calistirma: node src/services/sureMotoru.service.test.js
//
// NOT: Alan ismi uyarlama (W1-M4 ADIM 0 bulgusu):
//   - Gorev belgesi olayTarihi/basvuruTarihi/kazaSonucu kullaniyor
//   - Gercek schema: accidentDate / injurySeverity
//   - sureMotoru.service.js normalizeLead() ile her ikisini de kabul eder
//   - Bu test hem DB alanlari hem kanik alan isimleriyle calisir
// -----------------------------------------------------------------------------

const { hesaplaSureler } = require("./sureMotoru.service");

function gunOnce(gun) {
  const d = new Date();
  d.setDate(d.getDate() - gun);
  return d;
}

const senaryolar = [
  {
    ad: "1. Trafik sigortasi basvurusu 10 gun once (DB alanlari) — SARI/KIRMIZI beklenir",
    lead: {
      muhatapTipi: "TRAFIK_SIGORTASI",
      ihtarnameler: [{ gonderimTarihi: gunOnce(10) }], // basvuruTarihi buradan turetilir
      accidentDate: gunOnce(30),                        // olayTarihi buradan turetilir
      injurySeverity: "AGIR_YARALANMA",                 // kazaSonucu='yaralanma' turetilir
    },
  },
  {
    ad: "2. Trafik sigortasi basvurusu 16 gun once — GECTI beklenir",
    lead: {
      muhatapTipi: "TRAFIK_SIGORTASI",
      ihtarnameler: [{ gonderimTarihi: gunOnce(16) }],
      accidentDate: gunOnce(60),
      injurySeverity: "YARALANMA",
    },
  },
  {
    ad: "3. Isveren is kazasi 1 gun once — KIRMIZI beklenir (2 gun kaldi)",
    lead: {
      muhatapTipi: "ISVEREN",
      accidentDate: gunOnce(1),
      injurySeverity: "AGIR",
    },
  },
  {
    ad: "4. SGK rucu 5 yil once — YESIL beklenir",
    lead: {
      muhatapTipi: "SGK",
      accidentDate: gunOnce(365 * 5),
      injurySeverity: "YARALANMA",
    },
  },
  {
    ad: "5. Muhatapsiz lead, sadece TBK zamanasimi (yaralanma 1 yil once) — DIKKAT/YESIL",
    lead: {
      muhatapTipi: null,
      accidentDate: gunOnce(365),
      injurySeverity: "YARALANMA",
    },
  },
  {
    ad: "6. Trafik sigortasi — basvuruTarihi YOK (ihtarname gonderilmemis) — SIGORTA_CEVAP tetiklenmemeli",
    lead: {
      muhatapTipi: "TRAFIK_SIGORTASI",
      ihtarnameler: [], // bos, gonderimTarihi yok
      accidentDate: gunOnce(10),
      injurySeverity: "YARALANMA",
    },
  },
  {
    ad: "7. Bos lead — bos array donmeli",
    lead: {},
  },
];

console.log("=".repeat(80));
console.log("SURE MOTORU MANUEL DOGRULAMA (W1-M4)");
console.log("=".repeat(80));

let hataVar = false;
for (const s of senaryolar) {
  console.log("\n" + s.ad);
  console.log("-".repeat(80));
  try {
    const sonuc = hesaplaSureler(s.lead);
    if (sonuc.length === 0) {
      console.log("  (hic sure tetiklenmedi)");
    } else {
      for (const u of sonuc) {
        console.log(
          `  [${u.durum.padEnd(7)}] ${u.etiket.padEnd(38)} ${u.kalanGun >= 0 ? "+" : ""}${u.kalanGun} gun  (${u.yasalDayanak})`
        );
      }
    }
  } catch (e) {
    console.log(`  HATA: ${e.message}`);
    hataVar = true;
  }
}

console.log("\n" + "=".repeat(80));
if (hataVar) {
  console.log("SONUC: HATALAR VAR — mimara bildir.");
} else {
  console.log("SONUC: Tum senaryolar hatasiz caldi. Beklenen degerlerle karsilastir.");
}
console.log("=".repeat(80));
