"use strict";

const { calculateCompensationV2 } = require("../compensation.engine.v2");

// ── Ortak test input'ları ────────────────────────────────────────────

const maluliyetVakasi = {
  kaza:   { tarihi: "2024-06-15", tipi: "trafik" },
  magdur: { dogumTarihi: "1989-06-15", cinsiyet: "E", gelir: { tutar: 45000, belgeli: true } },
  sonuc:  { durum: "maluliyet", maluliyetOrani: { deger: 35, mod: "A" }, tedaviSuresiGun: 90, sagGideri: 50000 },
  kusur:  { magdurKusuru: 0, karsiTarafKusuru: 100, kaynak: "tutanak" },
  sigorta: { mevcutOdeme: 0 },
  aile:   {},
};

const olumVakasi = {
  kaza:   { tarihi: "2024-06-15", tipi: "trafik" },
  magdur: { dogumTarihi: "1979-06-15", cinsiyet: "E", gelir: { tutar: 50000, belgeli: true } },
  sonuc:  { durum: "olum", maluliyetOrani: { deger: 0, mod: "B" }, tedaviSuresiGun: 0, sagGideri: 0 },
  kusur:  { magdurKusuru: 0, karsiTarafKusuru: 100, kaynak: "tutanak" },
  sigorta: { mevcutOdeme: 0 },
  aile:   { es: { yas: 42, cinsiyet: "K" }, cocuklar: [{ yas: 10 }, { yas: 15 }] },
};

const agirMaluliyetVakasi = {
  kaza:   { tarihi: "2024-06-15", tipi: "is" },
  magdur: { dogumTarihi: "1989-06-15", cinsiyet: "E", gelir: { tutar: 40000, belgeli: true } },
  sonuc:  { durum: "maluliyet", maluliyetOrani: { deger: 75, mod: "A" }, tedaviSuresiGun: 180, sagGideri: 100000 },
  kusur:  { magdurKusuru: 0, karsiTarafKusuru: 100, kaynak: "tutanak" },
  sigorta: { mevcutOdeme: 0 },
  aile:   {},
};

const eskiKazaVakasi = {
  kaza:   { tarihi: "2008-03-10", tipi: "trafik" },
  magdur: { dogumTarihi: "1978-03-10", cinsiyet: "E", gelir: { tutar: 30000, belgeli: true } },
  sonuc:  { durum: "maluliyet", maluliyetOrani: { deger: 20, mod: "A" }, tedaviSuresiGun: 60, sagGideri: 20000 },
  kusur:  { magdurKusuru: 0, karsiTarafKusuru: 100, kaynak: "tutanak" },
  sigorta: { mevcutOdeme: 0 },
  aile:   {},
};

// ── TEST 1: Temel hesap — finalToplam > 0 ───────────────────────────
describe("calculateCompensationV2 — maluliyet vakasi", () => {
  let sonuc;
  beforeAll(() => { sonuc = calculateCompensationV2(maluliyetVakasi); });

  test("hesap.finalToplam > 0", () => {
    expect(sonuc.hesap.finalToplam).toBeGreaterThan(0);
  });

  test("senaryo sirasi: iyimser > gercekci > kotumser", () => {
    expect(sonuc.senaryolar.iyimser.toplam).toBeGreaterThan(sonuc.senaryolar.gercekci.toplam);
    expect(sonuc.senaryolar.gercekci.toplam).toBeGreaterThan(sonuc.senaryolar.kotumser.toplam);
  });

  test("motorVersiyonu v2.1", () => {
    expect(sonuc.motorVersiyonu).toBe("v2.1");
  });
});

// ── TEST 2: Maluliyet 0 ─────────────────────────────────────────────
describe("calculateCompensationV2 — maluliyet 0", () => {
  test("surekliMaluliyetTazminati.toplam === 0", () => {
    const input = {
      ...maluliyetVakasi,
      sonuc: { ...maluliyetVakasi.sonuc, maluliyetOrani: { deger: 0, mod: "B" } },
    };
    const sonuc = calculateCompensationV2(input);
    expect(sonuc.kalemler.surekliMaluliyetTazminati.toplam).toBe(0);
  });
});

// ── TEST 3: Ölümlü + aile ──────────────────────────────────────────
describe("calculateCompensationV2 — olumlu vaka", () => {
  let sonuc;
  beforeAll(() => { sonuc = calculateCompensationV2(olumVakasi); });

  test("kalemler.destektenYoksunKalma.toplam > 0", () => {
    expect(sonuc.kalemler.destektenYoksunKalma.toplam).toBeGreaterThan(0);
  });

  test("yaralanma vakasinda destektenYoksunKalma === 0", () => {
    const yaralanma = { ...maluliyetVakasi, sonuc: { ...maluliyetVakasi.sonuc, durum: "yaralanma" } };
    const s = calculateCompensationV2(yaralanma);
    expect(s.kalemler.destektenYoksunKalma.toplam).toBe(0);
  });
});

// ── TEST 4: Müterafik kusur ─────────────────────────────────────────
describe("calculateCompensationV2 — muterafik kusur", () => {
  test("magdurKusuru %20 → muterafikIndirim > 0", () => {
    const input = {
      ...maluliyetVakasi,
      kusur: { magdurKusuru: 20, karsiTarafKusuru: 80, kaynak: "tutanak" },
    };
    const sonuc = calculateCompensationV2(input);
    expect(sonuc.hesap.muterafikIndirim).toBeGreaterThan(0);
  });

  test("muterafik %20 → finalToplam < brutToplam", () => {
    const input = {
      ...maluliyetVakasi,
      kusur: { magdurKusuru: 20, karsiTarafKusuru: 80, kaynak: "tutanak" },
    };
    const sonuc = calculateCompensationV2(input);
    expect(sonuc.hesap.finalToplam).toBeLessThan(sonuc.hesap.brutToplam);
  });
});

// ── TEST 5: Ağır maluliyet — bakıcı gideri ─────────────────────────
describe("calculateCompensationV2 — agir maluliyet", () => {
  test("%75 maluliyet → kalemler.bakiciGideri.tetiklendi === true", () => {
    const sonuc = calculateCompensationV2(agirMaluliyetVakasi);
    expect(sonuc.kalemler.bakiciGideri.tetiklendi).toBe(true);
  });
});

// ── TEST 6: Eski kaza — yönetmelik seçimi ─────────────────────────
// 2008-03-10 → SSIT yürürlükte (CGM_2008 başlangıcı 2008-10-11)
// 2008-11-01 → CGM_2008 yürürlükte
describe("calculateCompensationV2 — eski kaza yonetmelik secimi", () => {
  test("2008-03-10 kazasi → mevzuat.maluliyetYonetmeligi.id === 'SSIT'", () => {
    const sonuc = calculateCompensationV2(eskiKazaVakasi);
    expect(sonuc.mevzuat.maluliyetYonetmeligi.id).toBe("SSIT");
  });

  test("2008-11-01 kazasi → mevzuat.maluliyetYonetmeligi.id === 'CGM_2008'", () => {
    const input = {
      ...eskiKazaVakasi,
      kaza: { ...eskiKazaVakasi.kaza, tarihi: "2008-11-01" },
      magdur: { ...eskiKazaVakasi.magdur, dogumTarihi: "1978-11-01" },
    };
    const sonuc = calculateCompensationV2(input);
    expect(sonuc.mevzuat.maluliyetYonetmeligi.id).toBe("CGM_2008");
  });
});

// ── TEST 7: Panel uyumu — zorunlu alanlar ──────────────────────────
describe("calculateCompensationV2 — panel uyumu", () => {
  let sonuc;
  beforeAll(() => { sonuc = calculateCompensationV2(maluliyetVakasi); });

  test("senaryolar alani mevcut: iyimser, gercekci, kotumser", () => {
    expect(sonuc.senaryolar).toHaveProperty("iyimser.toplam");
    expect(sonuc.senaryolar).toHaveProperty("gercekci.toplam");
    expect(sonuc.senaryolar).toHaveProperty("kotumser.toplam");
  });

  test("mevzuat alanlari mevcut", () => {
    expect(sonuc.mevzuat).toHaveProperty("maluliyetYonetmeligi.kisaAd");
    expect(sonuc.mevzuat).toHaveProperty("zamanasimi.kalanYil");
    expect(sonuc.mevzuat).toHaveProperty("zmssLimitYili");
  });

  test("zmssKontrol alani mevcut: asar, uyari", () => {
    expect(sonuc.zmssKontrol).toHaveProperty("asar");
    expect(sonuc.zmssKontrol).toHaveProperty("uyari");
  });

  test("uyarilar dizi olarak geliyor", () => {
    expect(Array.isArray(sonuc.uyarilar)).toBe(true);
  });

  test("disclaimer string olarak geliyor", () => {
    expect(typeof sonuc.disclaimer).toBe("string");
    expect(sonuc.disclaimer.length).toBeGreaterThan(0);
  });

  test("senaryolar olasılık alani mevcut", () => {
    expect(sonuc.senaryolar.iyimser).toHaveProperty("olasılık");
    expect(sonuc.senaryolar.gercekci).toHaveProperty("olasılık");
    expect(sonuc.senaryolar.kotumser).toHaveProperty("olasılık");
  });
});

// ── TEST 8: ZMSS aşımı ─────────────────────────────────────────────
describe("calculateCompensationV2 — ZMSS asimi", () => {
  test("cok buyuk tazminatta zmssKontrol.asar === true", () => {
    const buyukVaka = {
      kaza:    { tarihi: "2026-01-01", tipi: "trafik" },
      magdur:  { dogumTarihi: "1996-01-01", cinsiyet: "E", gelir: { tutar: 200000, belgeli: true } },
      sonuc:   { durum: "maluliyet", maluliyetOrani: { deger: 100, mod: "A" }, tedaviSuresiGun: 365, sagGideri: 500000 },
      kusur:   { magdurKusuru: 0, karsiTarafKusuru: 100, kaynak: "tutanak" },
      sigorta: { mevcutOdeme: 0 },
      aile:    {},
    };
    const sonuc = calculateCompensationV2(buyukVaka);
    expect(sonuc.zmssKontrol.asar).toBe(true);
  });
});
