const { getZMSSLimitsByDate, checkZMSSAsimi, ZMSS_LIMITS } = require("../zmss-limits");

describe("ZMSS Limit Servisi", () => {
  describe("getZMSSLimitsByDate", () => {
    test("2026 kişi başı bedeni limit 3.600.000 TL", () => {
      const r = getZMSSLimitsByDate("2026-04-19");
      expect(r.bedeni_kisi).toBe(3_600_000);
      expect(r.yil).toBe("2026");
      expect(r.uyari).toBeUndefined();
    });

    test("2020 kişi başı bedeni limit 390.000 TL", () => {
      const r = getZMSSLimitsByDate("2020-06-15");
      expect(r.bedeni_kisi).toBe(390_000);
    });

    test("2015 doğru limitleri döndürmeli", () => {
      const r = getZMSSLimitsByDate("2015-09-01");
      expect(r.bedeni_kisi).toBe(290_000);
      expect(r.maddi_arac).toBe(29_000);
    });

    test("2011 öncesi uyarı döndürmeli", () => {
      const r = getZMSSLimitsByDate("2008-01-01");
      expect(r.uyari).toBe(true);
      expect(r.uyariMesaji).toContain("SEDDK arşivinden");
    });

    test("Gelecek yıl için uyarı ile güncel limit", () => {
      const r = getZMSSLimitsByDate("2030-01-01");
      expect(r.uyari).toBe(true);
      expect(r.bedeni_kisi).toBe(3_600_000);
    });

    test("Geçersiz tarih hata fırlatmalı", () => {
      expect(() => getZMSSLimitsByDate("abc")).toThrow("Geçersiz kaza tarihi");
    });
  });

  describe("checkZMSSAsimi", () => {
    test("Limit aşan tazminat için uyarı", () => {
      const r = checkZMSSAsimi(5_000_000, "2026-01-01");
      expect(r.asar).toBe(true);
      expect(r.fark).toBe(1_400_000);
      expect(r.uyari).toContain("İMM poliçesi");
    });

    test("Limit altı tazminat için uyarı yok", () => {
      const r = checkZMSSAsimi(2_000_000, "2026-01-01");
      expect(r.asar).toBe(false);
      expect(r.uyari).toBeNull();
    });

    test("Eski tarihli kaza için o yılın limiti kullanılır", () => {
      // 2018'de 330K limit, 400K tazminat → aşıyor
      const r = checkZMSSAsimi(400_000, "2018-06-15");
      expect(r.asar).toBe(true);
      expect(r.limit).toBe(330_000);
      expect(r.limitYili).toBe("2018");
    });
  });
});
