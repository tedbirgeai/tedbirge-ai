function clean(value, fallback = "-") {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function renderEDevletInfo(data) {
  return `E-DEVLET VEKÂLET SÜRECİ BİLGİLENDİRME METNİ

Sayın ${clean(data.client_name)},

Dosyanızın türü: ${clean(data.case_type_label)}

Bu dosya için avukatlık sürecinin yürütülebilmesi adına VEKÂLET işleminin tamamlanması gerekmektedir.
Süreç şu şekildedir:

1. Kimlik bilgileriniz ve dosya bilgileriniz doğrulanır.
2. VEKÂLET verilecek avukat bilgileri teyit edilir.
3. İlgili yetki kapsamı dosya türüne göre belirlenir.
4. İşlem tamamlandığında belge ofis tarafından kontrol edilir.

Avukat Bilgileri
Adı Soyadı      : ${clean(data.lawyer_name)}
Barosu          : ${clean(data.bar_name)}
Sicil No        : ${clean(data.bar_number)}

Dosyaya Özel Yetki Başlıkları
${clean(data.special_authority_summary)}

Eksik / Hatalı bilgi olması hâlinde işlem yeniden düzenlenecektir.`;
}

module.exports = {
  renderEDevletInfo
};
