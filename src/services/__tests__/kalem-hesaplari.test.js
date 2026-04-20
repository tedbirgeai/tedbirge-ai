"use strict";

const {
  progresifRant,
  tedaviGideri,
  geciciIsGoremezlik,
  surekliMaluliyet,
  destektenYoksunKalma,
  evlenmeIhtimaliIndirimi,
  bakiciGideri,
  maneviTazminat,
  hesaplaTumKalemler,
  BAKICI_ESIGI_MALULIYET,
} = require("../kalem-hesaplari");

// ── progresifRant ────────────────────────────────────────────────────
describe("progresifRant", () => {
  test("120000 yillik gelir, 10 yil → pozitif", () => {
    expect(progresifRant(120000, 10)).toBeGreaterThan(0);
  });

  test("yillik gelir 0 → 0", () => {
    expect(progresifRant(0, 10)).toBe(0);
  });

  test("yil sayisi 0 → 0", () => {
    expect(progresifRant(100000, 0)).toBe(0);
  });

  test("%10 artis + %10 iskonto → net etki yok, toplam = yillik × yilSayisi (tam yil)", () => {
    // (1.10/1.10) = 1 → her yil ayni deger, toplam = gelir × yil
    const yillik = 100_000;
    const yil = 5;
    expect(progresifRant(yillik, yil)).toBe(yillik * yil);
  });
});

// ── tedaviGideri ────────────────────────────────────────────────────
describe("tedaviGideri", () => {
  test("85000 gider → toplam 85000", () => {
    expect(tedaviGideri(85000).toplam).toBe(85000);
  });

  test("0 gider → toplam 0", () => {
    expect(tedaviGideri(0).toplam).toBe(0);
  });

  test("kaynak TBK m.54 icerir", () => {
    expect(tedaviGideri(1000).kaynak).toMatch(/TBK/);
  });
});

// ── geciciIsGoremezlik ───────────────────────────────────────────────
describe("geciciIsGoremezlik", () => {
  test("120 gun × 45000/ay → 180000", () => {
    // 120 × (45000/30) = 120 × 1500 = 180000
    expect(geciciIsGoremezlik(120, 45000).toplam).toBe(180000);
  });

  test("0 gun → toplam 0", () => {
    expect(geciciIsGoremezlik(0, 45000).toplam).toBe(0);
  });

  test("0 gelir → toplam 0", () => {
    expect(geciciIsGoremezlik(30, 0).toplam).toBe(0);
  });
});

// ── surekliMaluliyet ─────────────────────────────────────────────────
describe("surekliMaluliyet", () => {
  const temelParams = {
    kazaTarihi: "2024-06-15",
    yas: 35,
    cinsiyet: "E",
    maluliyetOrani: 35,
    aylikGelir: 45000,
  };

  test("35 yas erkek, %35 maluliyet, 45000/ay → toplam > 6.000.000", () => {
    expect(surekliMaluliyet(temelParams).toplam).toBeGreaterThan(6_000_000);
  });

  test("maluliyetOrani 0 → toplam 0", () => {
    expect(surekliMaluliyet({ ...temelParams, maluliyetOrani: 0 }).toplam).toBe(0);
  });

  test("kadin icin pasif donem erkekten uzun (ayni yas/maluliyet)", () => {
    const erkek = surekliMaluliyet({ ...temelParams, cinsiyet: "E" });
    const kadin = surekliMaluliyet({ ...temelParams, cinsiyet: "K" });
    expect(kadin.pasifDonem).toBeGreaterThan(erkek.pasifDonem);
  });

  test("sonucta aktifYil ve pasifYil alanlari mevcut", () => {
    const sonuc = surekliMaluliyet(temelParams);
    expect(sonuc.aktifYil).toBeGreaterThan(0);
    expect(sonuc.pasifYil).toBeGreaterThan(0);
  });
});

// ── destektenYoksunKalma ─────────────────────────────────────────────
describe("destektenYoksunKalma — toplamPay", () => {
  const temelParams = {
    kazaTarihi: "2024-06-15",
    yas: 45,
    cinsiyet: "E",
    aylikGelir: 50000,
  };

  test("45 yas erkek + es(42) + 2 cocuk + anne + baba → toplamPay === 8", () => {
    // destek:2 + es:2 + 2cocuk:2 + anne:1 + baba:1 = 8
    const sonuc = destektenYoksunKalma({
      ...temelParams,
      aile: {
        es: { yas: 42, cinsiyet: "K" },
        cocuklar: [{ yas: 10 }, { yas: 15 }],
        anneVarMi: true,
        babaVarMi: true,
      },
    });
    expect(sonuc.toplamPay).toBe(8);
  });

  test("es tek (cocuksuz, anne/baba yok) → toplamPay === 4 (destek:2 + es:2)", () => {
    const sonuc = destektenYoksunKalma({
      ...temelParams,
      aile: { es: { yas: 40, cinsiyet: "K" } },
    });
    expect(sonuc.toplamPay).toBe(4);
  });

  test("gelir 0 → toplam 0", () => {
    const sonuc = destektenYoksunKalma({
      ...temelParams,
      aylikGelir: 0,
      aile: { es: { yas: 40, cinsiyet: "K" } },
    });
    expect(sonuc.toplam).toBe(0);
  });

  test("aile bilgisi bos → toplam 0 (kimse yok)", () => {
    const sonuc = destektenYoksunKalma({ ...temelParams, aile: {} });
    expect(sonuc.toplam).toBe(0);
  });
});

// ── evlenmeIhtimaliIndirimi ──────────────────────────────────────────
describe("evlenmeIhtimaliIndirimi", () => {
  test("19 yas, cocuk yok → oran 0.52", () => {
    expect(evlenmeIhtimaliIndirimi(19, []).oran).toBe(0.52);
  });

  test("45 yas, cocuk yok → oran 0.02", () => {
    expect(evlenmeIhtimaliIndirimi(45, []).oran).toBe(0.02);
  });

  test("42 yas + 2 kucuk cocuk → oran 0 (0.02 - 0.10 < 0, min 0)", () => {
    // 42 yas → tablo 0.02; 2 çocuk × 0.05 = 0.10; 0.02 - 0.10 = -0.08 → max(0, -0.08) = 0
    expect(evlenmeIhtimaliIndirimi(42, [{ yas: 10 }, { yas: 15 }]).oran).toBe(0);
  });

  test("60 yas → oran 0 (56+ dilimi)", () => {
    expect(evlenmeIhtimaliIndirimi(60, []).oran).toBe(0);
  });

  test("18 yas altı olmayan cocuklar indirimi etkilemez", () => {
    // 45 yas + 2 yetişkin çocuk (yas:20)
    expect(evlenmeIhtimaliIndirimi(45, [{ yas: 20 }, { yas: 22 }]).oran).toBe(0.02);
  });
});

// ── bakiciGideri ────────────────────────────────────────────────────
describe("bakiciGideri", () => {
  const temelParams = {
    kazaTarihi: "2024-06-15",
    yas: 35,
    cinsiyet: "E",
  };

  test("%75 maluliyet → tetiklendi true", () => {
    expect(bakiciGideri({ ...temelParams, maluliyetOrani: 75 }).tetiklendi).toBe(true);
  });

  test("%50 maluliyet, ATK raporu yok → tetiklendi false", () => {
    expect(bakiciGideri({ ...temelParams, maluliyetOrani: 50 }).tetiklendi).toBe(false);
  });

  test("%50 maluliyet + atkBakicaMuhtac:true → tetiklendi true", () => {
    expect(
      bakiciGideri({ ...temelParams, maluliyetOrani: 50, atkBakicaMuhtac: true }).tetiklendi
    ).toBe(true);
  });

  test("%70 esik — tam esik tetikler (>=)", () => {
    expect(bakiciGideri({ ...temelParams, maluliyetOrani: 70 }).tetiklendi).toBe(true);
  });

  test("%75 maluliyet → toplam pozitif", () => {
    expect(bakiciGideri({ ...temelParams, maluliyetOrani: 75 }).toplam).toBeGreaterThan(0);
  });
});

// ── maneviTazminat ──────────────────────────────────────────────────
describe("maneviTazminat", () => {
  test("olum → aralik.min >= 100000", () => {
    expect(maneviTazminat({ durum: "olum" }).aralık.min).toBeGreaterThanOrEqual(100_000);
  });

  test("yaralanma → aralik.max < 150000", () => {
    expect(maneviTazminat({ durum: "yaralanma" }).aralık.max).toBeLessThan(150_000);
  });

  test("maluliyet, %50 → aralik.min > yaralanma aralik.max", () => {
    const maluliyet = maneviTazminat({ durum: "maluliyet", maluliyetOrani: 50 });
    const yaralanma = maneviTazminat({ durum: "yaralanma" });
    expect(maluliyet.aralık.min).toBeGreaterThan(yaralanma.aralık.max);
  });

  test("olum → tahmini aralik min-max arasinda", () => {
    const sonuc = maneviTazminat({ durum: "olum" });
    expect(sonuc.tahmini).toBeGreaterThanOrEqual(sonuc.aralık.min);
    expect(sonuc.tahmini).toBeLessThanOrEqual(sonuc.aralık.max);
  });
});

// ── hesaplaTumKalemler — ana fonksiyon ──────────────────────────────
describe("hesaplaTumKalemler", () => {
  const maluliyetVakasi = {
    kaza: { tarihi: "2024-06-15", tipi: "trafik" },
    magdur: {
      dogumTarihi: "1989-06-15", // 35 yas
      cinsiyet: "E",
      gelir: { tutar: 45000, belgeli: true },
    },
    sonuc: {
      durum: "maluliyet",
      maluliyetOrani: { deger: 35, mod: "A" },
      tedaviSuresiGun: 90,
      sagGideri: 50000,
    },
    aile: {},
  };

  const olumVakasi = {
    kaza: { tarihi: "2024-06-15", tipi: "trafik" },
    magdur: {
      dogumTarihi: "1979-06-15", // 45 yas
      cinsiyet: "E",
      gelir: { tutar: 50000, belgeli: true },
    },
    sonuc: {
      durum: "olum",
      maluliyetOrani: { deger: 0, mod: "B" },
      tedaviSuresiGun: 0,
      sagGideri: 0,
    },
    aile: {
      es: { yas: 42, cinsiyet: "K" },
      cocuklar: [{ yas: 10 }, { yas: 15 }],
    },
  };

  const sadeceyaralanmaVakasi = {
    kaza: { tarihi: "2024-06-15", tipi: "trafik" },
    magdur: {
      dogumTarihi: "1989-06-15",
      cinsiyet: "E",
      gelir: { tutar: 40000, belgeli: true },
    },
    sonuc: {
      durum: "yaralanma",
      maluliyetOrani: { deger: 0, mod: "B" },
      tedaviSuresiGun: 60,
      sagGideri: 20000,
    },
    aile: {},
  };

  test("35 yas maluliyet vakasi → toplam > 6.000.000", () => {
    expect(hesaplaTumKalemler(maluliyetVakasi).toplam).toBeGreaterThan(6_000_000);
  });

  test("olumlu vaka → destektenYoksunKalma.toplam > 0", () => {
    expect(
      hesaplaTumKalemler(olumVakasi).kalemler.destektenYoksunKalma.toplam
    ).toBeGreaterThan(0);
  });

  test("sadece yaralanma (maluliyet 0, olum yok) → destektenYoksunKalma.toplam === 0", () => {
    expect(
      hesaplaTumKalemler(sadeceyaralanmaVakasi).kalemler.destektenYoksunKalma.toplam
    ).toBe(0);
  });

  test("sonucta kalemler objesi 6 kalem iceriyor", () => {
    const sonuc = hesaplaTumKalemler(maluliyetVakasi);
    expect(Object.keys(sonuc.kalemler)).toHaveLength(6);
  });
});
