const { hesaplaZamanasimi } = require("../zamanasimi.service");

describe("Zamanaşımı Servisi", () => {
  // Test sabit bugün: 2026-04-19
  // Not: Gerçek testte Date'i mock'lamak lazım, ama bu kodda göstermelik

  test("Ölüm kazası 15 yıl, taze kaza", () => {
    const r = hesaplaZamanasimi("2025-01-15", "olum");
    expect(r.zamanasimiSuresi).toBe(15);
    expect(r.dolmusMu).toBe(false);
    expect(r.dayanak).toContain("TCK m.85");
  });

  test("Yaralanma kazası 8 yıl", () => {
    const r = hesaplaZamanasimi("2024-06-01", "yaralanma");
    expect(r.zamanasimiSuresi).toBe(8);
    expect(r.dayanak).toContain("TCK m.89");
  });

  test("Maddi hasar 2 yıl", () => {
    const r = hesaplaZamanasimi("2024-12-01", "maddi");
    expect(r.zamanasimiSuresi).toBe(2);
  });

  test("15 yıl önce ölümlü kaza — zamanaşımı dolmuş", () => {
    const r = hesaplaZamanasimi("2005-01-01", "olum");
    expect(r.dolmusMu).toBe(true);
    expect(r.uyariSeviyesi).toBe("DOLMUS");
  });

  test("Maluliyet kesinleşme tarihi başlangıç olmalı", () => {
    const r = hesaplaZamanasimi("2020-01-01", "yaralanma", "2024-06-01");
    expect(r.baslangicTarihi).toBe("2024-06-01");
    expect(r.baslangicNedeni).toContain("Maluliyet");
  });

  test("Geçersiz kaza sonucu hata", () => {
    expect(() => hesaplaZamanasimi("2025-01-01", "xxx")).toThrow("Geçersiz kaza sonucu");
  });

  test("Geçersiz tarih hata", () => {
    expect(() => hesaplaZamanasimi("abc", "olum")).toThrow("Geçersiz kaza tarihi");
  });

  test("herHalde10Yil bilgisi dönmeli", () => {
    const r = hesaplaZamanasimi("2024-01-01", "olum");
    expect(r.herHalde10Yil).toBeDefined();
    expect(r.herHalde10Yil.bitis).toBeDefined();
  });
});
