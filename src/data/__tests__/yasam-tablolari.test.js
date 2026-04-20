"use strict";

const {
  trh2010Bakiye,
  pmf1931Bakiye,
  bakiyeOmur,
} = require("../yasam-tablolari");

// ── trh2010Bakiye ────────────────────────────────────────────────
describe("trh2010Bakiye", () => {
  test("30 erkek → 44.45", () => {
    expect(trh2010Bakiye(30, "E")).toBe(44.45);
  });

  test("30 kadin → 49.00", () => {
    expect(trh2010Bakiye(30, "K")).toBe(49.0);
  });

  test("65 erkek → 14.04", () => {
    expect(trh2010Bakiye(65, "E")).toBe(14.04);
  });

  test("0 kadin → 78.02", () => {
    expect(trh2010Bakiye(0, "K")).toBe(78.02);
  });

  test("97+ yas 97'ye sabitleniyor", () => {
    expect(trh2010Bakiye(100, "E")).toBe(trh2010Bakiye(97, "E"));
  });

  test("gecersiz yas (-5) → throw", () => {
    expect(() => trh2010Bakiye(-5, "E")).toThrow();
  });

  test("gecersiz cinsiyet ('X') → throw", () => {
    expect(() => trh2010Bakiye(30, "X")).toThrow();
  });
});

// ── pmf1931Bakiye ────────────────────────────────────────────────
describe("pmf1931Bakiye", () => {
  test("30 → 37.50", () => {
    expect(pmf1931Bakiye(30)).toBe(37.5);
  });

  test("35 → 33.49", () => {
    expect(pmf1931Bakiye(35)).toBe(33.49);
  });

  test("85 interpolasyon → 3.5-3.6 arasi", () => {
    const val = pmf1931Bakiye(85);
    expect(val).toBeGreaterThan(3.5);
    expect(val).toBeLessThan(3.6);
  });

  test("gecersiz yas (-1) → throw", () => {
    expect(() => pmf1931Bakiye(-1)).toThrow();
  });
});

// ── bakiyeOmur ───────────────────────────────────────────────────
describe("bakiyeOmur — tablo secimi", () => {
  test("2008 kazasi → PMF_1931 secilir", () => {
    const sonuc = bakiyeOmur("2008-05-15", 35, "E");
    expect(sonuc.kullanilanTablo).toBe("PMF_1931");
  });

  test("2024 kazasi → TRH_2010 secilir", () => {
    const sonuc = bakiyeOmur("2024-05-15", 35, "E");
    expect(sonuc.kullanilanTablo).toBe("TRH_2010");
  });

  test("kadin bakiye omru erkekten uzun (TRH 2010)", () => {
    const erkek = bakiyeOmur("2024-05-15", 35, "E");
    const kadin = bakiyeOmur("2024-05-15", 35, "K");
    expect(kadin.bakiyeOmur).toBeGreaterThan(erkek.bakiyeOmur);
  });

  test("olumYasi = yas + bakiyeOmur (yuvarlanmis)", () => {
    const sonuc = bakiyeOmur("2024-05-15", 30, "E");
    expect(sonuc.olumYasi).toBeCloseTo(30 + sonuc.bakiyeOmur, 0);
  });

  test("gecersiz kaza tarihi → throw", () => {
    expect(() => bakiyeOmur("gecersiz-tarih", 30, "E")).toThrow();
  });
});
