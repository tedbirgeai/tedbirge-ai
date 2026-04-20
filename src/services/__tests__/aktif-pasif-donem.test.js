"use strict";

const {
  hesaplaDonemler,
  EMEKLILIK_YASI,
} = require("../aktif-pasif-donem");

// ── Temel erkek/kadin senaryolari ────────────────────────────────
describe("hesaplaDonemler — temel senaryolar", () => {
  test("35 yas erkek 2024 kazasi → aktifYil=25, pasifYil~14.7, emeklilikYasi=60", () => {
    const sonuc = hesaplaDonemler("2024-06-15", 35, "E");
    expect(sonuc.aktifYil).toBe(25);
    expect(sonuc.pasifYil).toBeCloseTo(14.7, 0);
    expect(sonuc.emeklilikYasi).toBe(60);
  });

  test("35 yas kadin 2024 kazasi → aktifYil=23, pasifYil~21.1, emeklilikYasi=58", () => {
    const sonuc = hesaplaDonemler("2024-06-15", 35, "K");
    expect(sonuc.aktifYil).toBe(23);
    expect(sonuc.pasifYil).toBeCloseTo(21.1, 0);
    expect(sonuc.emeklilikYasi).toBe(58);
  });

  test("62 yas erkek → aktifYil=0, pasifYil>0", () => {
    const sonuc = hesaplaDonemler("2024-06-15", 62, "E");
    expect(sonuc.aktifYil).toBe(0);
    expect(sonuc.pasifYil).toBeGreaterThan(0);
  });

  test("50 yas + zatenEmekliMi:true → aktifYil=0, pasifYil=tum bakiye", () => {
    const sonuc = hesaplaDonemler("2024-06-15", 50, "E", { zatenEmekliMi: true });
    expect(sonuc.aktifYil).toBe(0);
    expect(sonuc.pasifYil).toBeCloseTo(sonuc.bakiyeOmur, 1);
  });
});

// ── Yasam tablosu secimi ─────────────────────────────────────────
describe("hesaplaDonemler — tablo secimi", () => {
  test("2008 kazasi → kullanilanTablo PMF_1931", () => {
    const sonuc = hesaplaDonemler("2008-05-15", 35, "E");
    expect(sonuc.kullanilanTablo).toBe("PMF_1931");
  });

  test("2024 kazasi → kullanilanTablo TRH_2010", () => {
    const sonuc = hesaplaDonemler("2024-05-15", 35, "E");
    expect(sonuc.kullanilanTablo).toBe("TRH_2010");
  });
});

// ── Override ve ozel durumlar ────────────────────────────────────
describe("hesaplaDonemler — override ve ozel durumlar", () => {
  test("emeklilikYasiOverride 55 → aktifYil=5 (50 yas icin)", () => {
    const sonuc = hesaplaDonemler("2024-06-15", 50, "E", { emeklilikYasiOverride: 55 });
    expect(sonuc.aktifYil).toBe(5);
  });

  test("17 yas → notlarda calisma yasi uyarisi var", () => {
    const sonuc = hesaplaDonemler("2024-06-15", 17, "E");
    const uyariVar = sonuc.notlar.some((n) => n.includes("18") || n.toLowerCase().includes("çalışma"));
    expect(uyariVar).toBe(true);
  });

  test("35 yas kadin → notlarda Kadin emeklilik yasi uyarisi", () => {
    const sonuc = hesaplaDonemler("2024-06-15", 35, "K");
    const uyariVar = sonuc.notlar.some((n) => n.toLowerCase().includes("kadın") || n.toLowerCase().includes("kadin"));
    expect(uyariVar).toBe(true);
  });
});

// ── Matematiksel tutarlilik ──────────────────────────────────────
describe("hesaplaDonemler — tutarlilik", () => {
  test("toplamYil === aktifYil + pasifYil", () => {
    const sonuc = hesaplaDonemler("2024-06-15", 40, "E");
    expect(sonuc.toplamYil).toBeCloseTo(sonuc.aktifYil + sonuc.pasifYil, 1);
  });

  test("kadin bakiye omru erkekten uzun (TRH 2010)", () => {
    const erkek = hesaplaDonemler("2024-06-15", 35, "E");
    const kadin = hesaplaDonemler("2024-06-15", 35, "K");
    expect(kadin.bakiyeOmur).toBeGreaterThan(erkek.bakiyeOmur);
  });
});

// ── Hata durumlari ───────────────────────────────────────────────
describe("hesaplaDonemler — hatali girdi", () => {
  test("gecersiz yas (-5) → throw", () => {
    expect(() => hesaplaDonemler("2024-06-15", -5, "E")).toThrow();
  });

  test("gecersiz yas (150) → throw", () => {
    expect(() => hesaplaDonemler("2024-06-15", 150, "E")).toThrow();
  });

  test("gecersiz cinsiyet ('X') → throw", () => {
    expect(() => hesaplaDonemler("2024-06-15", 35, "X")).toThrow();
  });
});
