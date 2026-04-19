const {
  selectYonetmelik,
  validateRaporYonetmelik,
  balthazardFormulu,
} = require("../maluliyet.yonetmelik.selector");

describe("Maluliyet Yönetmelik Seçici", () => {
  describe("selectYonetmelik", () => {
    test("2005 kazası SSİT döndürmeli", () => {
      expect(selectYonetmelik("2005-03-15").id).toBe("SSIT");
    });

    test("2008-10-10 SSİT (sınır günü dahil)", () => {
      expect(selectYonetmelik("2008-10-10").id).toBe("SSIT");
    });

    test("2008-10-11 ÇGM (geçiş günü)", () => {
      expect(selectYonetmelik("2008-10-11").id).toBe("CGM_2008");
    });

    test("2010 kazası ÇGM yönetmeliği", () => {
      expect(selectYonetmelik("2010-06-01").id).toBe("CGM_2008");
    });

    test("2013-09-01 Maluliyet 2013 (ilk gün)", () => {
      expect(selectYonetmelik("2013-09-01").id).toBe("MALULIYET_2013");
    });

    test("2014 kazası Maluliyet 2013", () => {
      expect(selectYonetmelik("2014-03-15").id).toBe("MALULIYET_2013");
    });

    test("2015-06-01 Özürlülük Yönetmeliği", () => {
      expect(selectYonetmelik("2015-06-01").id).toBe("OZURLULUK_2015");
    });

    test("2017 kazası Özürlülük Yönetmeliği", () => {
      expect(selectYonetmelik("2017-01-01").id).toBe("OZURLULUK_2015");
    });

    test("2019-02-19 Özürlülük (son gün)", () => {
      expect(selectYonetmelik("2019-02-19").id).toBe("OZURLULUK_2015");
    });

    test("2019-02-20 Engellilik Yönetmeliği", () => {
      expect(selectYonetmelik("2019-02-20").id).toBe("ENGELLILIK_2019");
    });

    test("2026 kazası Engellilik Yönetmeliği", () => {
      expect(selectYonetmelik("2026-04-19").id).toBe("ENGELLILIK_2019");
    });

    test("Geçersiz tarih hata fırlatmalı", () => {
      expect(() => selectYonetmelik("xxx")).toThrow("Geçersiz kaza tarihi");
    });
  });

  describe("validateRaporYonetmelik", () => {
    test("Doğru yönetmelik uyumlu sonuç verir", () => {
      const r = validateRaporYonetmelik("2022-01-01", "ENGELLILIK_2019");
      expect(r.uyumlu).toBe(true);
      expect(r.uyari).toBeNull();
    });

    test("Yanlış yönetmelik uyarı döndürür", () => {
      const r = validateRaporYonetmelik("2022-01-01", "OZURLULUK_2015");
      expect(r.uyumlu).toBe(false);
      expect(r.uyari).toContain("YARGI RİSKİ");
      expect(r.uyari).toContain("bozma nedenidir");
      expect(r.oneri).toContain("yeni bir Sağlık Kurulu Raporu");
    });

    test("2010 kazası için 2019 yönetmeliği yanlış", () => {
      const r = validateRaporYonetmelik("2010-05-01", "ENGELLILIK_2019");
      expect(r.uyumlu).toBe(false);
      expect(r.dogruYonetmelik.id).toBe("CGM_2008");
    });
  });

  describe("balthazardFormulu", () => {
    test("Boş dizi için 0", () => {
      expect(balthazardFormulu([]).toplam).toBe(0);
    });

    test("Tek engel değişmez", () => {
      expect(balthazardFormulu([25]).toplam).toBe(25);
    });

    test("%40 + %20 = %52 (düz toplam değil)", () => {
      const r = balthazardFormulu([40, 20]);
      expect(r.toplam).toBe(52);
    });

    test("Sıralama önemsiz (%20 + %40 de %52 verir)", () => {
      expect(balthazardFormulu([20, 40]).toplam).toBe(52);
    });

    test("%30 + %30 + %20 = ?", () => {
      // 30 + 70*0.3 = 30+21 = 51 → kalan 49 → 51 + 49*0.2 = 51+9.8 = 60.8
      const r = balthazardFormulu([30, 30, 20]);
      expect(r.toplam).toBe(60.8);
    });

    test("Geçersiz engel oranı hata fırlatmalı", () => {
      expect(() => balthazardFormulu([120])).toThrow("Geçersiz engel oranı");
      expect(() => balthazardFormulu([-5])).toThrow("Geçersiz engel oranı");
    });
  });
});
